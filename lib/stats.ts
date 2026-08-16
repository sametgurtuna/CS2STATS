// Pure, testable derivation of PlayerStats from the raw Steam stat blob.
// Extracted from app/api/steam/route.ts (Faz 1) so these calculations can be
// unit tested independently of the network/route layer.

import type { Badge, ClutchStat, MapStat, PlayerStats, WeaponStat } from "./types";

export const WEAPON_STATS = [
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
] as const;

export const MAP_STATS = [
  { key: 'de_dust2', name: 'Dust II' }, { key: 'de_inferno', name: 'Inferno' },
  { key: 'de_mirage', name: 'Mirage' }, { key: 'de_nuke', name: 'Nuke' },
  { key: 'de_overpass', name: 'Overpass' }, { key: 'de_vertigo', name: 'Vertigo' },
  { key: 'de_ancient', name: 'Ancient' }, { key: 'de_anubis', name: 'Anubis' },
  { key: 'de_train', name: 'Train' },
] as const;

export interface RawStatEntry {
  name: string;
  value: number;
}

/** Builds a `name -> value` lookup over Steam's flat stat list, 0 if missing. */
export function makeStatLookup(list: RawStatEntry[]) {
  return (name: string): number => list.find((s) => s.name === name)?.value || 0;
}

export function calcKD(kills: number, deaths: number): number {
  return deaths > 0 ? +(kills / deaths).toFixed(2) : 0;
}

export function calcHsPct(kills: number, headshots: number): number {
  return kills > 0 ? +((headshots / kills) * 100).toFixed(1) : 0;
}

export function calcWinRate(wins: number, rounds: number): number {
  return rounds > 0 ? +((wins / rounds) * 100).toFixed(1) : 0;
}

export function calcAccuracy(shotsHit: number, shotsFired: number): number {
  return shotsFired > 0 ? +((shotsHit / shotsFired) * 100).toFixed(1) : 0;
}

export function calcMvpPerMatch(mvps: number, matchesPlayed: number): number {
  return matchesPlayed > 0 ? +(mvps / matchesPlayed).toFixed(2) : 0;
}

export function calcDamagePerRound(damage: number, rounds: number): number {
  return rounds > 0 && damage > 0 ? +(damage / rounds).toFixed(1) : 0;
}

export function calcAwpRatio(awpKills: number, totalKills: number): number {
  return totalKills > 0 ? +((awpKills / totalKills) * 100).toFixed(1) : 0;
}

export function deriveWeapons(v: (name: string) => number): WeaponStat[] {
  return WEAPON_STATS.map((x) => ({ name: x.name, kills: v(x.key) }))
    .filter((x) => x.kills > 0)
    .sort((a, b) => b.kills - a.kills);
}

export function deriveMaps(v: (name: string) => number): MapStat[] {
  return MAP_STATS.map((m) => {
    const mw = v(`total_wins_map_${m.key}`);
    const mr = v(`total_rounds_map_${m.key}`);
    return { name: m.name, wins: mw, rounds: mr, wr: calcWinRate(mw, mr) };
  })
    .filter((m) => m.rounds > 0)
    .sort((a, b) => b.rounds - a.rounds);
}

export function computeBadges(stats: { hsPct: number; acc: number; kills: number; kd: number; awpR: number; winR: number; dpr: number }): Badge[] {
  const badges: Badge[] = [];
  if (stats.hsPct >= 50) badges.push({ id: "headshot", label: "Headshot Machine", color: "text-red-400 bg-red-400/10 border-red-400/20" });
  if (stats.acc < 15 && stats.kills > 100) badges.push({ id: "spray", label: "Spray & Pray", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" });
  if (stats.kd >= 1.3) badges.push({ id: "carry", label: "Hard Carry", color: "text-amber-300 bg-amber-300/10 border-amber-300/20" });
  if (stats.awpR >= 30) badges.push({ id: "awper", label: "AWP God", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" });
  if (stats.winR >= 55) badges.push({ id: "winner", label: "Winner", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" });
  if (stats.dpr >= 90) badges.push({ id: "damage", label: "Lethal Force", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" });
  if (badges.length === 0) badges.push({ id: "average", label: "Casual Player", color: "text-gray-400 bg-gray-400/10 border-gray-400/20" });
  return badges.slice(0, 3);
}

export interface WinProbabilityInput {
  kd: number;
  hsPct: number;
  winR: number;
  acc: number;
  mvpM: number;
  dpr: number;
}

const WIN_PROB_WEIGHTS: Record<keyof WinProbabilityInput, number> = {
  kd: 0.25,
  winR: 0.25,
  hsPct: 0.15,
  acc: 0.15,
  mvpM: 0.1,
  dpr: 0.1,
};

/**
 * Weighted composite score across N players (replaces the old equal-weighted
 * "who wins more categories" tally). Each stat is normalized against the best
 * player in the group before weighting, so the result is comparable across
 * very different stat scales (e.g. dpr ~80 vs acc ~20). Output is normalized
 * to sum to 100 across all players — read it as a rough "win probability" %.
 */
export function computeWinProbability(players: WinProbabilityInput[]): number[] {
  if (players.length === 0) return [];
  const keys = Object.keys(WIN_PROB_WEIGHTS) as (keyof WinProbabilityInput)[];
  const maxes: Record<string, number> = {};
  for (const k of keys) maxes[k] = Math.max(...players.map((p) => p[k]), 0.0001);

  const raw = players.map((p) => keys.reduce((sum, k) => sum + (p[k] / maxes[k]) * WIN_PROB_WEIGHTS[k], 0));
  const total = raw.reduce((a, b) => a + b, 0) || 1;
  return raw.map((r) => +((r / total) * 100).toFixed(1));
}

/** Orchestrates every derived stat from Steam's raw stat list. */
export function computePlayerStats(list: RawStatEntry[]): PlayerStats {
  const v = makeStatLookup(list);

  const k = v('total_kills'), d = v('total_deaths'), hs = v('total_kills_headshot');
  const w = v('total_wins'), r = v('total_rounds_played');
  const sf = v('total_shots_fired'), sh = v('total_shots_hit');
  const mvps = v('total_mvps'), mp = v('total_matches_played') || (r > 0 ? r / 20 : 0);
  const dmg = v('total_damage_done'), awpK = v('total_kills_awp');

  const kd = calcKD(k, d);
  const hsPct = calcHsPct(k, hs);
  const winR = calcWinRate(w, r);
  const acc = calcAccuracy(sh, sf);
  const mvpM = calcMvpPerMatch(mvps, mp);
  const dpr = calcDamagePerRound(dmg, r);
  const awpR = calcAwpRatio(awpK, k);

  const clutch: ClutchStat = {
    pistolWins: v('total_wins_pistolround'),
    dominations: v('total_dominations'),
    revenges: v('total_revenges'),
    lm: {
      k: v('last_match_kills'), d: v('last_match_deaths'), mvp: v('last_match_mvps'),
      dmg: v('last_match_damage'), w: v('last_match_wins'), r: v('last_match_rounds'),
    },
  };

  return {
    kd, hsPct, winR, acc, mvpM, dpr, awpR,
    kills: k, deaths: d, wins: w, rounds: r, played: Math.round(mp),
    weapons: deriveWeapons(v), maps: deriveMaps(v), clutch,
  };
}
