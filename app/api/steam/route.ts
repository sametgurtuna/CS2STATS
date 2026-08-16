import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';
import type { Badge, PlayerData } from '@/lib/types';

const WEAPON_STATS = [
  { key: 'total_kills_ak47', name: 'AK-47' }, { key: 'total_kills_m4a1', name: 'M4A4/M4A1-S' },
  { key: 'total_kills_awp', name: 'AWP' }, { key: 'total_kills_deagle', name: 'Desert Eagle' },
  { key: 'total_kills_glock', name: 'Glock-18' }, { key: 'total_kills_hkp2000', name: 'P2000/USP-S' },
  { key: 'total_kills_fiveseven', name: 'Five-SeveN' }, { key: 'total_kills_tec9', name: 'Tec-9' },
  { key: 'total_kills_p250', name: 'P250' }, { key: 'total_kills_aug', name: 'AUG' },
  { key: 'total_kills_sg556', name: 'SG 553' }, { key: 'total_kills_p90', name: 'P90' },
  { key: 'total_kills_mac10', name: 'MAC-10' }, { key: 'total_kills_ump45', name: 'UMP-45' },
  { key: 'total_kills_mp7', name: 'MP7' }, { key: 'total_kills_mp9', name: 'MP9' },
  { key: 'total_kills_bizon', name: 'PP-Bizon' }, { key: 'total_kills_galilar', name: 'Galil AR' },
  { key: 'total_kills_famas', name: 'FAMAS' }, { key: 'total_kills_ssg08', name: 'SSG 08' },
  { key: 'total_kills_nova', name: 'Nova' }, { key: 'total_kills_xm1014', name: 'XM1014' },
  { key: 'total_kills_knife', name: 'Knife' }, { key: 'total_kills_hegrenade', name: 'HE Grenade' },
];

const MAP_STATS = [
  { key: 'de_dust2', name: 'Dust II' }, { key: 'de_inferno', name: 'Inferno' },
  { key: 'de_mirage', name: 'Mirage' }, { key: 'de_nuke', name: 'Nuke' },
  { key: 'de_overpass', name: 'Overpass' }, { key: 'de_vertigo', name: 'Vertigo' },
  { key: 'de_ancient', name: 'Ancient' }, { key: 'de_anubis', name: 'Anubis' },
  { key: 'de_train', name: 'Train' },
];

const API_KEY = process.env.STEAM_API_KEY || "";
const FACEIT_API_KEY = process.env.FACEIT_API_KEY || "";

const httpsAgent = new https.Agent({ keepAlive: true, family: 4 });
const cache = new Map<string, { time: number; data: any }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { player } = body;

    if (!API_KEY) return NextResponse.json({ error: 'Server API key not configured.' }, { status: 500 });
    if (!player) return NextResponse.json({ error: 'Player info required.' }, { status: 400 });

    const cacheKey = player.trim().toLowerCase();
    const cached = cache.get(cacheKey);
    // 5 minutes cache
    if (cached && Date.now() - cached.time < 300000) {
      return NextResponse.json(cached.data);
    }

    let steamId = "";
    let extractedVanity = "";

    if (player.includes('steamcommunity.com/id/')) {
      extractedVanity = player.split('steamcommunity.com/id/')[1].split('/')[0].split('?')[0].trim();
      steamId = await resolveVanity(extractedVanity);
    } else if (player.includes('steamcommunity.com/profiles/')) {
      steamId = player.split('steamcommunity.com/profiles/')[1].split('/')[0].split('?')[0].trim();
    } else if (/^7656119[0-9]{10}$/.test(player.trim())) {
      steamId = player.trim();
    } else {
      extractedVanity = player.trim();
      steamId = await resolveVanity(extractedVanity);
    }

    if (!steamId) return NextResponse.json({ error: `Could not resolve "${extractedVanity}".` }, { status: 404 });

    const f = (url: string, headers?: any) => axios.get(url, { httpsAgent, timeout: 8000, headers }).catch(e => e.response || { status: 500, data: null });
    
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

    if (sumR.status === 403) return NextResponse.json({ error: 'Invalid API key.' }, { status: 403 });
    const p = sumR.data?.response?.players?.[0];
    if (!p) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });

    let hours = 0;
    if (gameR.status === 200) {
      const cs2 = gameR.data?.response?.games?.find((g: any) => g.appid === 730);
      if (cs2) hours = Math.round(cs2.playtime_forever / 60);
    }

    let topSkins: any[] = [];
    if (invR.status === 200 && invR.data?.descriptions) {
      const allSkins = invR.data.descriptions.filter((item: any) => item.icon_url && item.market_name && item.market_name.includes("|") && !item.market_name.includes("Graffiti") && !item.market_name.includes("Sticker") && !item.market_name.includes("Case") && !item.market_name.includes("Key"));
      // Simple rarity sorter (Covert > Classified > Restricted > Mil-Spec > Industrial > Consumer)
      const rarityScale: Record<string, number> = { "Covert": 6, "Classified": 5, "Restricted": 4, "Mil-Spec Grade": 3, "Industrial Grade": 2, "Consumer Grade": 1 };
      
      topSkins = allSkins.sort((a: any, b: any) => {
        const getR = (i: any) => rarityScale[i.tags?.find((t: any) => t.category === "Rarity")?.localized_tag_name] || 0;
        return getR(b) - getR(a);
      }).slice(0, 3).map((item: any) => ({
        name: item.market_name,
        color: item.tags?.find((t: any) => t.category === "Rarity")?.color || "ffffff",
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
      cache.set(cacheKey, { time: Date.now(), data: respData });
      return NextResponse.json(respData);
    }

    const list = statR.data?.playerstats?.stats || [];
    const v = (n: string) => list.find((s: any) => s.name === n)?.value || 0;

    const k = v('total_kills'), d = v('total_deaths'), hs = v('total_kills_headshot');
    const w = v('total_wins'), r = v('total_rounds_played');
    const sf = v('total_shots_fired'), sh = v('total_shots_hit');
    const mvps = v('total_mvps'), mp = v('total_matches_played') || (r > 0 ? r / 20 : 0);
    const dmg = v('total_damage_done'), awpK = v('total_kills_awp');

    const kd = d > 0 ? +(k / d).toFixed(2) : 0;
    const hsPct = k > 0 ? +((hs / k) * 100).toFixed(1) : 0;
    const winR = r > 0 ? +((w / r) * 100).toFixed(1) : 0;
    const acc = sf > 0 ? +((sh / sf) * 100).toFixed(1) : 0;
    const mvpM = mp > 0 ? +(mvps / mp).toFixed(2) : 0;
    const dpr = r > 0 && dmg > 0 ? +(dmg / r).toFixed(1) : 0;
    const awpR = k > 0 ? +((awpK / k) * 100).toFixed(1) : 0;

    const badges: Badge[] = [];
    if (hsPct >= 50) badges.push({ id: "headshot", label: "Headshot Machine", color: "text-red-400 bg-red-400/10 border-red-400/20" });
    if (acc < 15 && k > 100) badges.push({ id: "spray", label: "Spray & Pray", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" });
    if (kd >= 1.3) badges.push({ id: "carry", label: "Hard Carry", color: "text-amber-300 bg-amber-300/10 border-amber-300/20" });
    if (awpR >= 30) badges.push({ id: "awper", label: "AWP God", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" });
    if (winR >= 55) badges.push({ id: "winner", label: "Winner", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" });
    if (dpr >= 90) badges.push({ id: "damage", label: "Lethal Force", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" });
    if (badges.length === 0) badges.push({ id: "average", label: "Casual Player", color: "text-gray-400 bg-gray-400/10 border-gray-400/20" });

    const weapons = WEAPON_STATS.map(x => ({ name: x.name, kills: v(x.key) })).filter(x => x.kills > 0).sort((a, b) => b.kills - a.kills);
    const maps = MAP_STATS.map(m => {
      const mw = v(`total_wins_map_${m.key}`), mr = v(`total_rounds_map_${m.key}`);
      return { name: m.name, wins: mw, rounds: mr, wr: mr > 0 ? +((mw / mr) * 100).toFixed(1) : 0 };
    }).filter(m => m.rounds > 0).sort((a, b) => b.rounds - a.rounds);

    const finalResponse: PlayerData = {
      player: { steamId: p.steamid, name: p.personaname, avatar: p.avatarfull, country: p.loccountrycode || "XX", state: p.personastate ?? 0, game: p.gameextrainfo },
      hours,
      skins: topSkins,
      badges: badges.slice(0, 3), // Max 3 badges
      faceit: faceitInfo,
      stats: { kd, hsPct, winR, acc, mvpM, dpr, awpR, kills: k, deaths: d, wins: w, rounds: r, played: Math.round(mp), weapons, maps,
        clutch: { pistolWins: v('total_wins_pistolround'), dominations: v('total_dominations'), revenges: v('total_revenges'),
          lm: { k: v('last_match_kills'), d: v('last_match_deaths'), mvp: v('last_match_mvps'), dmg: v('last_match_damage'), w: v('last_match_wins'), r: v('last_match_rounds') }
        }
      }
    };

    cache.set(cacheKey, { time: Date.now(), data: finalResponse });
    return NextResponse.json(finalResponse);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error.' }, { status: 500 });
  }
}

async function resolveVanity(vanity: string) {
  try {
    const r = await axios.get(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${API_KEY}&vanityurl=${vanity}`, { httpsAgent, timeout: 5000 });
    if (r.data?.response?.success === 1) return r.data.response.steamid;
  } catch {}
  return null;
}
