// 1v1 duel simulator (map + bombsite + side + weapon) for the "Duel Simulator"
// modal on the comparison dashboard.
//
// IMPORTANT — what this is and isn't: this is a *heuristic entertainment
// model*, not a real engine simulation. It blends the players' real derived
// Steam stats (aim, K/D, ADR, map win rate) with hand-tuned weapon/position
// modifiers to produce a plausible win probability. The weapon and site
// constants below are deliberate design choices, not measured values — nobody
// should read the output as a factual prediction. Keep that framing in the UI.
//
// Everything here is pure and deterministic (no randomness) so it can be unit
// tested and so the same inputs always show the same result to a user sharing
// a screenshot.

import type { PlayerStats } from "./types";

export type Side = "T" | "CT";
export type EngagementRange = "short" | "medium" | "long";

export interface WeaponProfile {
  id: string;
  label: string;
  /** Relative effectiveness at each engagement range (1 = neutral). */
  range: Record<EngagementRange, number>;
  /** Speed-to-kill advantage; higher = kills faster in a straight trade. */
  lethality: number;
  /** How much this weapon rewards the player's headshot skill. */
  hsLeverage: number;
}

export const WEAPONS: WeaponProfile[] = [
  { id: "ak47", label: "AK-47", range: { short: 0.95, medium: 1.1, long: 1.05 }, lethality: 1.1, hsLeverage: 1.3 },
  { id: "m4a4", label: "M4A4 / M4A1-S", range: { short: 1.0, medium: 1.1, long: 1.0 }, lethality: 1.0, hsLeverage: 1.1 },
  { id: "awp", label: "AWP", range: { short: 0.6, medium: 1.05, long: 1.45 }, lethality: 1.35, hsLeverage: 0.7 },
  { id: "ssg08", label: "SSG 08 (Scout)", range: { short: 0.75, medium: 1.0, long: 1.2 }, lethality: 1.1, hsLeverage: 1.0 },
  { id: "deagle", label: "Desert Eagle", range: { short: 0.95, medium: 1.0, long: 0.95 }, lethality: 1.05, hsLeverage: 1.45 },
  { id: "galil", label: "Galil / FAMAS", range: { short: 0.95, medium: 0.95, long: 0.85 }, lethality: 0.85, hsLeverage: 1.1 },
  { id: "mp9", label: "MP9 / MAC-10", range: { short: 1.25, medium: 0.85, long: 0.55 }, lethality: 0.9, hsLeverage: 0.85 },
  { id: "p90", label: "P90", range: { short: 1.2, medium: 0.95, long: 0.65 }, lethality: 0.95, hsLeverage: 0.8 },
  { id: "pistol", label: "Pistol (Glock / USP-S)", range: { short: 0.9, medium: 0.7, long: 0.5 }, lethality: 0.65, hsLeverage: 1.2 },
];

export function getWeapon(id: string): WeaponProfile {
  return WEAPONS.find((w) => w.id === id) ?? WEAPONS[0];
}

export interface DuelSite {
  id: string;
  label: string;
  range: EngagementRange;
  /**
   * Baseline share of duels the CT-sided player wins here (0..1), before any
   * player skill is applied — encodes "the CT is usually the one holding the
   * angle". 0.5 = neutral.
   */
  ctAdvantage: number;
  /** Position in the schematic's 0..100 viewBox (see DuelMapSchematic). */
  x: number;
  y: number;
}

export interface DuelMap {
  /** Matches the Steam stat key used in lib/stats.ts MAP_STATS. */
  id: string;
  label: string;
  sites: DuelSite[];
  tSpawn: { x: number; y: number };
  ctSpawn: { x: number; y: number };
}

export const DUEL_MAPS: DuelMap[] = [
  {
    id: "de_dust2",
    label: "Dust II",
    tSpawn: { x: 50, y: 88 },
    ctSpawn: { x: 50, y: 12 },
    sites: [
      { id: "a", label: "A Site", range: "long", ctAdvantage: 0.56, x: 76, y: 26 },
      { id: "b", label: "B Site", range: "short", ctAdvantage: 0.6, x: 20, y: 24 },
      { id: "mid", label: "Mid", range: "long", ctAdvantage: 0.58, x: 50, y: 50 },
    ],
  },
  {
    id: "de_mirage",
    label: "Mirage",
    tSpawn: { x: 50, y: 88 },
    ctSpawn: { x: 50, y: 12 },
    sites: [
      { id: "a", label: "A Site", range: "long", ctAdvantage: 0.55, x: 74, y: 30 },
      { id: "b", label: "B Site (Apps)", range: "short", ctAdvantage: 0.58, x: 22, y: 30 },
      { id: "mid", label: "Mid / Connector", range: "medium", ctAdvantage: 0.57, x: 50, y: 52 },
    ],
  },
  {
    id: "de_inferno",
    label: "Inferno",
    tSpawn: { x: 50, y: 88 },
    ctSpawn: { x: 50, y: 14 },
    sites: [
      { id: "a", label: "A Site", range: "medium", ctAdvantage: 0.57, x: 72, y: 28 },
      { id: "b", label: "B Site (Banana)", range: "short", ctAdvantage: 0.62, x: 24, y: 26 },
      { id: "mid", label: "Mid", range: "medium", ctAdvantage: 0.55, x: 50, y: 52 },
    ],
  },
  {
    id: "de_nuke",
    label: "Nuke",
    tSpawn: { x: 50, y: 88 },
    ctSpawn: { x: 50, y: 14 },
    sites: [
      { id: "a", label: "A Site (Upper)", range: "medium", ctAdvantage: 0.62, x: 56, y: 30 },
      { id: "b", label: "B Site (Lower)", range: "short", ctAdvantage: 0.6, x: 44, y: 52 },
      { id: "outside", label: "Outside", range: "long", ctAdvantage: 0.52, x: 22, y: 62 },
    ],
  },
  {
    id: "de_ancient",
    label: "Ancient",
    tSpawn: { x: 50, y: 88 },
    ctSpawn: { x: 50, y: 14 },
    sites: [
      { id: "a", label: "A Site", range: "medium", ctAdvantage: 0.57, x: 72, y: 30 },
      { id: "b", label: "B Site", range: "short", ctAdvantage: 0.6, x: 24, y: 30 },
      { id: "mid", label: "Mid", range: "medium", ctAdvantage: 0.55, x: 50, y: 52 },
    ],
  },
  {
    id: "de_anubis",
    label: "Anubis",
    tSpawn: { x: 50, y: 88 },
    ctSpawn: { x: 50, y: 14 },
    sites: [
      { id: "a", label: "A Site", range: "medium", ctAdvantage: 0.54, x: 72, y: 30 },
      { id: "b", label: "B Site", range: "medium", ctAdvantage: 0.56, x: 24, y: 30 },
      { id: "mid", label: "Mid", range: "long", ctAdvantage: 0.55, x: 50, y: 52 },
    ],
  },
  {
    id: "de_overpass",
    label: "Overpass",
    tSpawn: { x: 50, y: 88 },
    ctSpawn: { x: 50, y: 14 },
    sites: [
      { id: "a", label: "A Site (Bank)", range: "medium", ctAdvantage: 0.58, x: 70, y: 30 },
      { id: "b", label: "B Site (Monster)", range: "short", ctAdvantage: 0.6, x: 26, y: 32 },
      { id: "mid", label: "Mid / Connector", range: "medium", ctAdvantage: 0.55, x: 50, y: 54 },
    ],
  },
  {
    id: "de_train",
    label: "Train",
    tSpawn: { x: 50, y: 88 },
    ctSpawn: { x: 50, y: 14 },
    sites: [
      { id: "a", label: "A Site", range: "long", ctAdvantage: 0.6, x: 70, y: 30 },
      { id: "b", label: "B Site", range: "medium", ctAdvantage: 0.58, x: 26, y: 30 },
      { id: "mid", label: "Mid / Ivy", range: "medium", ctAdvantage: 0.55, x: 50, y: 52 },
    ],
  },
];

export function getMap(id: string): DuelMap {
  return DUEL_MAPS.find((m) => m.id === id) ?? DUEL_MAPS[0];
}

export function getSite(map: DuelMap, siteId: string): DuelSite {
  return map.sites.find((s) => s.id === siteId) ?? map.sites[0];
}

export interface DuelPlayerInput {
  name: string;
  stats: PlayerStats;
  weaponId: string;
  side: Side;
  /** Map win rate % from this player's own Steam stats, if they've played it. */
  mapWinRatePct?: number;
}

export interface DuelInput {
  mapId: string;
  siteId: string;
  players: [DuelPlayerInput, DuelPlayerInput];
}

export interface DuelFactor {
  key: string;
  /** Per-player contribution, already normalized to a 0..100 display scale. */
  values: [number, number];
}

export interface DuelResult {
  /** Win chance per player, sums to 100. */
  winProbability: [number, number];
  factors: DuelFactor[];
  engagementRange: EngagementRange;
}

/** Clamps to [min,max]. */
function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

/**
 * Raw aim/skill rating from the player's real Steam-derived stats. Weighted
 * toward K/D and headshot % because those survive the "how good is this
 * person in a straight 1v1" question better than volume stats do.
 */
export function computeAimRating(stats: PlayerStats, weapon: WeaponProfile): number {
  const kd = clamp(stats.kd / 1.5, 0, 1.6); // 1.5 K/D treated as "very strong"
  const hs = clamp(stats.hsPct / 60, 0, 1.4); // 60% HS treated as "very strong"
  const acc = clamp(stats.acc / 25, 0, 1.4); // 25% accuracy treated as "very strong"
  const adr = clamp(stats.dpr / 100, 0, 1.4); // 100 ADR treated as "very strong"

  // hsLeverage lets a headshot-heavy player get more out of a Deagle/AK than
  // out of an AWP, where raw one-shot lethality matters more than precision.
  const hsWeighted = hs * weapon.hsLeverage;

  return 0.34 * kd + 0.26 * hsWeighted + 0.2 * acc + 0.2 * adr;
}

/** Weapon suitability for the engagement range implied by the chosen site. */
export function computeWeaponRating(weapon: WeaponProfile, range: EngagementRange): number {
  return weapon.range[range] * weapon.lethality;
}

/**
 * Positional rating: the site's baseline CT hold advantage, nudged by how
 * well this player actually performs on this map (their own Steam map win
 * rate). Players who've never played the map get the neutral 50%.
 */
export function computePositionRating(side: Side, ctAdvantage: number, mapWinRatePct?: number): number {
  const sideFactor = side === "CT" ? ctAdvantage : 1 - ctAdvantage;
  const mapFactor = clamp((mapWinRatePct ?? 50) / 50, 0.6, 1.4);
  // Scaled so a neutral site (0.5) with a neutral map record lands on 1.0.
  return sideFactor * 2 * mapFactor;
}

export function simulateDuel(input: DuelInput): DuelResult {
  const map = getMap(input.mapId);
  const site = getSite(map, input.siteId);
  const range = site.range;

  const ratings = input.players.map((p) => {
    const weapon = getWeapon(p.weaponId);
    const aim = computeAimRating(p.stats, weapon);
    const gun = computeWeaponRating(weapon, range);
    const pos = computePositionRating(p.side, site.ctAdvantage, p.mapWinRatePct);
    return { aim, gun, pos, total: aim * gun * pos };
  });

  const totalSum = ratings[0].total + ratings[1].total || 1;
  const p0 = (ratings[0].total / totalSum) * 100;

  const share = (a: number, b: number): [number, number] => {
    const sum = a + b || 1;
    return [+((a / sum) * 100).toFixed(1), +((b / sum) * 100).toFixed(1)];
  };

  return {
    winProbability: [+p0.toFixed(1), +(100 - p0).toFixed(1)],
    engagementRange: range,
    factors: [
      { key: "duel.factor.aim", values: share(ratings[0].aim, ratings[1].aim) },
      { key: "duel.factor.weapon", values: share(ratings[0].gun, ratings[1].gun) },
      { key: "duel.factor.position", values: share(ratings[0].pos, ratings[1].pos) },
    ],
  };
}
