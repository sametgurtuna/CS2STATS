// Full Steam (+ optional FACEIT) fetch/derive pipeline for a single resolved
// SteamID64. Extracted from app/api/steam/route.ts (Faz 2) so app/player/[steamid]
// can reuse the exact same data shape without going through the API route.
//
// Callers are responsible for resolving vanity names/URLs to a SteamID64 first
// (see lib/steam.ts's resolveSteamId) and for caching — this module always
// hits the network.

import axios from "axios";
import https from "https";
import type { PlayerData, Skin } from "@/lib/types";
import { computeBadges, computePlayerStats } from "@/lib/stats";

const API_KEY = process.env.STEAM_API_KEY || "";
const FACEIT_API_KEY = process.env.FACEIT_API_KEY || "";

const httpsAgent = new https.Agent({ keepAlive: true, family: 4 });

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

/** Thrown when Steam's GetPlayerSummaries has no player for the given SteamID64. */
export class PlayerNotFoundError extends Error {}

/** Thrown when Steam rejects our API key (403) — distinct from "not found". */
export class SteamApiKeyError extends Error {}

export async function fetchPlayerData(steamId: string): Promise<PlayerData> {
  if (!API_KEY) throw new Error("Server API key not configured.");

  const f = (url: string, headers?: Record<string, string>) =>
    axios.get(url, { httpsAgent, timeout: 8000, headers }).catch((e) => e.response || { status: 500, data: null });

  const parallelRequests = [
    f(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${API_KEY}&steamids=${steamId}`),
    f(`https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key=${API_KEY}&steamid=${steamId}`),
    f(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${API_KEY}&steamid=${steamId}&format=json`),
    f(`https://steamcommunity.com/inventory/${steamId}/730/2?l=english&count=100`),
  ];

  if (FACEIT_API_KEY) {
    parallelRequests.push(f(`https://open.faceit.com/data/v4/players?game=cs2&game_player_id=${steamId}`, { Authorization: `Bearer ${FACEIT_API_KEY}` }));
  }

  const [sumR, statR, gameR, invR, faceitR] = await Promise.all(parallelRequests);

  if (sumR.status === 403) {
    throw new SteamApiKeyError("Invalid API key.");
  }

  const p = sumR.data?.response?.players?.[0];
  if (!p) throw new PlayerNotFoundError(`Profile not found for ${steamId}.`);

  let hours = 0;
  if (gameR.status === 200) {
    const cs2 = (gameR.data?.response?.games as SteamOwnedGame[] | undefined)?.find((g) => g.appid === 730);
    if (cs2) hours = Math.round(cs2.playtime_forever / 60);
  }

  let topSkins: Skin[] = [];
  if (invR.status === 200 && invR.data?.descriptions) {
    const allSkins = (invR.data.descriptions as InventoryItem[]).filter(
      (item) => item.icon_url && item.market_name && item.market_name.includes("|") && !item.market_name.includes("Graffiti") && !item.market_name.includes("Sticker") && !item.market_name.includes("Case") && !item.market_name.includes("Key")
    );
    const rarityScale: Record<string, number> = { Covert: 6, Classified: 5, Restricted: 4, "Mil-Spec Grade": 3, "Industrial Grade": 2, "Consumer Grade": 1 };

    topSkins = allSkins
      .sort((a, b) => {
        const getR = (i: InventoryItem) => rarityScale[i.tags?.find((t) => t.category === "Rarity")?.localized_tag_name || ""] || 0;
        return getR(b) - getR(a);
      })
      .slice(0, 3)
      .map((item) => ({
        name: item.market_name,
        color: item.tags?.find((t) => t.category === "Rarity")?.color || "ffffff",
        image: `https://community.cloudflare.steamstatic.com/economy/image/${item.icon_url}`,
      }));
  }

  let faceitInfo = null;
  if (faceitR && faceitR.status === 200 && faceitR.data) {
    faceitInfo = {
      playerId: faceitR.data.player_id as string | undefined,
      level: faceitR.data.games?.cs2?.skill_level || faceitR.data.games?.csgo?.skill_level || 1,
      elo: faceitR.data.games?.cs2?.faceit_elo || faceitR.data.games?.csgo?.faceit_elo || null,
      url: faceitR.data.faceit_url?.replace("{lang}", "en"),
    };
  }

  if (statR.status !== 200 || !statR.data) {
    return {
      player: { steamId: p.steamid, name: p.personaname, avatar: p.avatarfull, country: p.loccountrycode || "XX", state: p.personastate ?? 0, game: p.gameextrainfo },
      hours,
      skins: topSkins,
      faceit: faceitInfo,
      badges: [],
      stats: null,
      error: "Private profile.",
    };
  }

  const list = statR.data?.playerstats?.stats || [];
  const stats = computePlayerStats(list);
  const badges = computeBadges(stats);

  return {
    player: { steamId: p.steamid, name: p.personaname, avatar: p.avatarfull, country: p.loccountrycode || "XX", state: p.personastate ?? 0, game: p.gameextrainfo },
    hours,
    skins: topSkins,
    badges,
    faceit: faceitInfo,
    stats,
  };
}
