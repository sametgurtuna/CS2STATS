// Minimal Steam identity resolution, shared between app/api/steam/route.ts
// (full stats fetch) and app/api/og/route.tsx (lightweight name+avatar only
// for the dynamic share-card image). Faz 2's lib/fetchPlayer.ts will build on
// top of resolveSteamId for the full single-player fetch/derive pipeline.

import axios from "axios";
import https from "https";

const API_KEY = process.env.STEAM_API_KEY || "";
const httpsAgent = new https.Agent({ keepAlive: true, family: 4 });

export async function resolveVanity(vanity: string): Promise<string | null> {
  try {
    const r = await axios.get(
      `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${API_KEY}&vanityurl=${vanity}`,
      { httpsAgent, timeout: 5000 }
    );
    if (r.data?.response?.success === 1) return r.data.response.steamid;
  } catch {
    // caller decides how to surface this; a failed resolve just means "not found"
  }
  return null;
}

export async function resolveSteamId(player: string): Promise<string | null> {
  const trimmed = player.trim();
  if (trimmed.includes('steamcommunity.com/id/')) {
    const vanity = trimmed.split('steamcommunity.com/id/')[1]?.split('/')[0]?.split('?')[0]?.trim();
    return vanity ? resolveVanity(vanity) : null;
  }
  if (trimmed.includes('steamcommunity.com/profiles/')) {
    return trimmed.split('steamcommunity.com/profiles/')[1]?.split('/')[0]?.split('?')[0]?.trim() || null;
  }
  if (/^7656119[0-9]{10}$/.test(trimmed)) return trimmed;
  return resolveVanity(trimmed);
}

export interface SteamSummary {
  steamId: string;
  name: string;
  avatar: string;
}

export async function fetchSteamSummary(steamId: string): Promise<SteamSummary | null> {
  try {
    const r = await axios.get(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${API_KEY}&steamids=${steamId}`,
      { httpsAgent, timeout: 8000 }
    );
    const p = r.data?.response?.players?.[0];
    if (!p) return null;
    return { steamId: p.steamid, name: p.personaname, avatar: p.avatarfull };
  } catch {
    return null;
  }
}
