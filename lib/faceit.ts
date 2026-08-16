// FACEIT Data API v4 — lifetime/map stats + match history, for the
// "FACEIT Performance" section on app/player/[steamid] (Faz 6).
//
// Schemas below were verified live against the real API during development
// (not just the docs, which render poorly through automated fetching):
//   GET /players/{player_id}/stats/{game_id} -> { lifetime, segments[] }
//     lifetime and each segment's `stats` are flat Record<string,string> —
//     FACEIT returns every stat value as a string, even numeric ones.
//   GET /players/{player_id}/history?game=&limit= -> { items[] }
//     match summaries do NOT include the map played (map is per-match, only
//     visible via GET /matches/{id}.voting.map.pick) — fetching that per
//     match would multiply API calls for a mostly-cosmetic detail, so match
//     history here is deliberately map-less.
// Rate limit observed: 20 requests/second per key (ratelimit-limit header).
// Fine for our per-page-view volume; callers should still cache (see
// app/player/[steamid]/page.tsx) rather than calling on every request.

import axios from "axios";
import https from "https";

const FACEIT_API_KEY = process.env.FACEIT_API_KEY || "";
const BASE = "https://open.faceit.com/data/v4";
const httpsAgent = new https.Agent({ keepAlive: true, family: 4 });

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${FACEIT_API_KEY}` };
}

function toNum(v: string | undefined): number {
  const n = v === undefined ? NaN : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export interface FaceitMapStat {
  map: string;
  matches: number;
  winRatePct: number;
  avgKD: number;
  avgAdr: number;
}

export interface FaceitLifetimeStats {
  matches: number;
  winRatePct: number;
  avgKD: number;
  currentWinStreak: number;
  longestWinStreak: number;
  maps: FaceitMapStat[];
}

interface RawFaceitStatsResponse {
  lifetime?: Record<string, string>;
  segments?: { label: string; stats: Record<string, string> }[];
}

export async function fetchFaceitStats(faceitPlayerId: string): Promise<FaceitLifetimeStats | null> {
  if (!FACEIT_API_KEY) return null;
  try {
    const r = await axios.get<RawFaceitStatsResponse>(`${BASE}/players/${faceitPlayerId}/stats/cs2`, { httpsAgent, timeout: 8000, headers: authHeaders() });
    const lifetime = r.data.lifetime || {};
    const maps = (r.data.segments || [])
      .map((s): FaceitMapStat => ({
        map: s.label,
        matches: toNum(s.stats["Total Matches"] ?? s.stats["Matches"]),
        winRatePct: toNum(s.stats["Win Rate %"]),
        avgKD: toNum(s.stats["Average K/D Ratio"] ?? s.stats["K/D Ratio"]),
        avgAdr: toNum(s.stats["ADR"]),
      }))
      .filter((m) => m.matches > 0)
      .sort((a, b) => b.matches - a.matches);

    return {
      matches: toNum(lifetime["Matches"]),
      winRatePct: toNum(lifetime["Win Rate %"]),
      avgKD: toNum(lifetime["Average K/D Ratio"]),
      currentWinStreak: toNum(lifetime["Current Win Streak"]),
      longestWinStreak: toNum(lifetime["Longest Win Streak"]),
      maps,
    };
  } catch {
    return null;
  }
}

export interface FaceitMatchSummary {
  matchId: string;
  competitionName: string;
  finishedAt: number; // unix seconds
  won: boolean;
  score: string; // "13:11"
  faceitUrl?: string;
}

interface RawFaceitTeamPlayer {
  player_id: string;
}
interface RawFaceitTeam {
  players?: RawFaceitTeamPlayer[];
}
interface RawFaceitHistoryItem {
  match_id: string;
  competition_name?: string;
  finished_at: number;
  teams: Record<string, RawFaceitTeam>;
  results?: { winner?: string; score?: Record<string, number> };
  faceit_url?: string;
}
interface RawFaceitHistoryResponse {
  items?: RawFaceitHistoryItem[];
}

export async function fetchFaceitMatchHistory(faceitPlayerId: string, limit = 8): Promise<FaceitMatchSummary[]> {
  if (!FACEIT_API_KEY) return [];
  try {
    const r = await axios.get<RawFaceitHistoryResponse>(`${BASE}/players/${faceitPlayerId}/history`, {
      httpsAgent,
      timeout: 8000,
      headers: authHeaders(),
      params: { game: "cs2", limit },
    });

    return (r.data.items || []).map((it): FaceitMatchSummary => {
      const factionKey = Object.entries(it.teams || {}).find(([, team]) => team.players?.some((p) => p.player_id === faceitPlayerId))?.[0];
      const won = Boolean(factionKey && it.results?.winner === factionKey);
      const score = it.results?.score ? Object.values(it.results.score).join(":") : "";
      return {
        matchId: it.match_id,
        competitionName: it.competition_name || "",
        finishedAt: it.finished_at,
        won,
        score,
        faceitUrl: it.faceit_url?.replace("{lang}", "en"),
      };
    });
  } catch {
    return [];
  }
}
