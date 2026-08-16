import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';
import * as Sentry from '@sentry/nextjs';
import type { PlayerData, Skin } from '@/lib/types';
import { computeBadges, computePlayerStats } from '@/lib/stats';
import { isValidPlayerInput } from '@/lib/validation';
import { getRatelimit, getRedis, isRedisConfigured } from '@/lib/redis';
import { resolveSteamId } from '@/lib/steam';

interface SteamOwnedGame {
  appid: number;
  playtime_forever: number;
}

interface InventoryTag {
  category: string;
  localized_tag_name: string;
  color?: string;
}

interface InventoryItem {
  icon_url: string;
  market_name: string;
  tags?: InventoryTag[];
}

const API_KEY = process.env.STEAM_API_KEY || "";
const FACEIT_API_KEY = process.env.FACEIT_API_KEY || "";

const httpsAgent = new https.Agent({ keepAlive: true, family: 4 });

const CACHE_TTL_SECONDS = 300; // 5 minutes
const memoryCache = new Map<string, { time: number; data: PlayerData }>();

async function getCached(key: string): Promise<PlayerData | null> {
  if (isRedisConfigured()) {
    try {
      return (await getRedis().get<PlayerData>(`cs2stats:cache:${key}`)) ?? null;
    } catch (e) {
      Sentry.captureException(e);
      return null;
    }
  }
  const hit = memoryCache.get(key);
  if (hit && Date.now() - hit.time < CACHE_TTL_SECONDS * 1000) return hit.data;
  return null;
}

async function setCached(key: string, data: PlayerData): Promise<void> {
  if (isRedisConfigured()) {
    try {
      await getRedis().set(`cs2stats:cache:${key}`, data, { ex: CACHE_TTL_SECONDS });
      return;
    } catch (e) {
      Sentry.captureException(e);
      // fall through to memory cache so a Redis hiccup doesn't break the response
    }
  }
  memoryCache.set(key, { time: Date.now(), data });
}

export async function POST(request: Request) {
  try {
    if (isRedisConfigured()) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      const { success } = await getRatelimit().limit(ip);
      if (!success) {
        return NextResponse.json({ error: 'Too many requests. Please wait a moment and try again.' }, { status: 429 });
      }
    }

    const body = await request.json();
    const { player } = body;

    if (!API_KEY) return NextResponse.json({ error: 'Server API key not configured.' }, { status: 500 });
    if (!player) return NextResponse.json({ error: 'Player info required.' }, { status: 400 });
    if (!isValidPlayerInput(player)) {
      return NextResponse.json({ error: 'Invalid Steam ID, vanity name, or profile URL format.' }, { status: 400 });
    }

    const cacheKey = player.trim().toLowerCase();
    const cached = await getCached(cacheKey);
    if (cached) return NextResponse.json(cached);

    const steamId = await resolveSteamId(player);
    if (!steamId) return NextResponse.json({ error: `Could not resolve "${player.trim()}".` }, { status: 404 });

    const f = (url: string, headers?: Record<string, string>) => axios.get(url, { httpsAgent, timeout: 8000, headers }).catch(e => e.response || { status: 500, data: null });

    const parallelRequests = [
      f(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${API_KEY}&steamids=${steamId}`),
      f(`https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key=${API_KEY}&steamid=${steamId}`),
      f(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${API_KEY}&steamid=${steamId}&format=json`),
      f(`https://steamcommunity.com/inventory/${steamId}/730/2?l=english&count=100`)
    ];

    if (FACEIT_API_KEY) {
      parallelRequests.push(f(`https://open.faceit.com/data/v4/players?game=cs2&game_player_id=${steamId}`, { Authorization: `Bearer ${FACEIT_API_KEY}` }));
    }

    const [sumR, statR, gameR, invR, faceitR] = await Promise.all(parallelRequests);

    if (sumR.status === 403) {
      Sentry.captureMessage('Steam API rejected key (403) on GetPlayerSummaries', 'error');
      return NextResponse.json({ error: 'Invalid API key.' }, { status: 403 });
    }
    if (sumR.status === 429) {
      Sentry.captureMessage('Steam API rate-limited us (429) on GetPlayerSummaries', 'warning');
    }
    const p = sumR.data?.response?.players?.[0];
    if (!p) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });

    let hours = 0;
    if (gameR.status === 200) {
      const cs2 = (gameR.data?.response?.games as SteamOwnedGame[] | undefined)?.find((g) => g.appid === 730);
      if (cs2) hours = Math.round(cs2.playtime_forever / 60);
    }

    let topSkins: Skin[] = [];
    if (invR.status === 200 && invR.data?.descriptions) {
      const allSkins = (invR.data.descriptions as InventoryItem[]).filter((item) => item.icon_url && item.market_name && item.market_name.includes("|") && !item.market_name.includes("Graffiti") && !item.market_name.includes("Sticker") && !item.market_name.includes("Case") && !item.market_name.includes("Key"));
      // Simple rarity sorter (Covert > Classified > Restricted > Mil-Spec > Industrial > Consumer)
      const rarityScale: Record<string, number> = { "Covert": 6, "Classified": 5, "Restricted": 4, "Mil-Spec Grade": 3, "Industrial Grade": 2, "Consumer Grade": 1 };

      topSkins = allSkins.sort((a, b) => {
        const getR = (i: InventoryItem) => rarityScale[i.tags?.find((t) => t.category === "Rarity")?.localized_tag_name || ""] || 0;
        return getR(b) - getR(a);
      }).slice(0, 3).map((item) => ({
        name: item.market_name,
        color: item.tags?.find((t) => t.category === "Rarity")?.color || "ffffff",
        image: `https://community.cloudflare.steamstatic.com/economy/image/${item.icon_url}`
      }));
    }

    let faceitInfo = null;
    if (faceitR && faceitR.status === 200 && faceitR.data) {
       faceitInfo = {
          level: faceitR.data.games?.cs2?.skill_level || faceitR.data.games?.csgo?.skill_level || 1,
          elo: faceitR.data.games?.cs2?.faceit_elo || faceitR.data.games?.csgo?.faceit_elo || null,
          url: faceitR.data.faceit_url?.replace('{lang}', 'en')
       };
    }

    if (statR.status !== 200 || !statR.data) {
      const respData: PlayerData = { player: { steamId: p.steamid, name: p.personaname, avatar: p.avatarfull, country: p.loccountrycode || "XX", state: p.personastate ?? 0, game: p.gameextrainfo }, hours, skins: topSkins, faceit: faceitInfo, badges: [], stats: null, error: "Private profile." };
      await setCached(cacheKey, respData);
      return NextResponse.json(respData);
    }

    const list = statR.data?.playerstats?.stats || [];
    const stats = computePlayerStats(list);
    const badges = computeBadges(stats);

    const finalResponse: PlayerData = {
      player: { steamId: p.steamid, name: p.personaname, avatar: p.avatarfull, country: p.loccountrycode || "XX", state: p.personastate ?? 0, game: p.gameextrainfo },
      hours,
      skins: topSkins,
      badges,
      faceit: faceitInfo,
      stats,
    };

    await setCached(cacheKey, finalResponse);
    return NextResponse.json(finalResponse);
  } catch (e) {
    Sentry.captureException(e);
    const message = e instanceof Error ? e.message : 'Server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
