import { describe, expect, it } from "vitest";
import { computeAimRating, computePositionRating, computeWeaponRating, getMap, getSite, getWeapon, simulateDuel, type DuelPlayerInput } from "./duel";
import type { PlayerStats } from "./types";

function makeStats(overrides: Partial<PlayerStats> = {}): PlayerStats {
  return {
    kd: 1.0,
    hsPct: 40,
    winR: 50,
    acc: 20,
    mvpM: 1,
    dpr: 80,
    awpR: 10,
    kills: 10000,
    deaths: 10000,
    wins: 500,
    rounds: 1000,
    played: 500,
    weapons: [],
    maps: [],
    clutch: { pistolWins: 0, dominations: 0, revenges: 0, lm: { k: 0, d: 0, mvp: 0, dmg: 0, w: 0, r: 0 } },
    ...overrides,
  };
}

function player(overrides: Partial<DuelPlayerInput> = {}): DuelPlayerInput {
  return { name: "P", stats: makeStats(), weaponId: "ak47", side: "T", ...overrides };
}

describe("getWeapon / getMap / getSite", () => {
  it("falls back to the first entry for unknown ids", () => {
    expect(getWeapon("does-not-exist").id).toBe("ak47");
    expect(getMap("de_nonexistent").id).toBe("de_dust2");
    const map = getMap("de_dust2");
    expect(getSite(map, "nope").id).toBe("a");
  });

  it("resolves known ids", () => {
    expect(getWeapon("awp").label).toBe("AWP");
    expect(getMap("de_mirage").label).toBe("Mirage");
    expect(getSite(getMap("de_dust2"), "b").label).toBe("B Site");
  });
});

describe("computeAimRating", () => {
  it("rates a stronger player higher", () => {
    const weapon = getWeapon("ak47");
    const good = computeAimRating(makeStats({ kd: 1.5, hsPct: 55, acc: 24, dpr: 95 }), weapon);
    const bad = computeAimRating(makeStats({ kd: 0.7, hsPct: 25, acc: 14, dpr: 55 }), weapon);
    expect(good).toBeGreaterThan(bad);
  });

  it("rewards a headshot-heavy player more on a high-hsLeverage weapon", () => {
    const hsPlayer = makeStats({ hsPct: 60 });
    const deagle = computeAimRating(hsPlayer, getWeapon("deagle"));
    const awp = computeAimRating(hsPlayer, getWeapon("awp"));
    expect(deagle).toBeGreaterThan(awp);
  });
});

describe("computeWeaponRating", () => {
  it("favors the AWP at long range and SMGs up close", () => {
    expect(computeWeaponRating(getWeapon("awp"), "long")).toBeGreaterThan(computeWeaponRating(getWeapon("mp9"), "long"));
    expect(computeWeaponRating(getWeapon("mp9"), "short")).toBeGreaterThan(computeWeaponRating(getWeapon("awp"), "short"));
  });
});

describe("computePositionRating", () => {
  it("gives the CT the edge on a CT-favored site", () => {
    expect(computePositionRating("CT", 0.6)).toBeGreaterThan(computePositionRating("T", 0.6));
  });

  it("is neutral (1.0) for a neutral site and no map history", () => {
    expect(computePositionRating("T", 0.5)).toBeCloseTo(1, 5);
    expect(computePositionRating("CT", 0.5)).toBeCloseTo(1, 5);
  });

  it("boosts a player with a strong record on the map", () => {
    expect(computePositionRating("T", 0.5, 70)).toBeGreaterThan(computePositionRating("T", 0.5, 40));
  });
});

describe("simulateDuel", () => {
  it("returns probabilities summing to 100", () => {
    const r = simulateDuel({ mapId: "de_dust2", siteId: "a", players: [player(), player()] });
    expect(r.winProbability[0] + r.winProbability[1]).toBeCloseTo(100, 1);
  });

  it("is a coin flip for two identical players on the same side", () => {
    const r = simulateDuel({ mapId: "de_mirage", siteId: "mid", players: [player(), player()] });
    expect(r.winProbability[0]).toBeCloseTo(50, 1);
  });

  it("favors the clearly better player, all else equal", () => {
    const strong = player({ stats: makeStats({ kd: 1.6, hsPct: 58, acc: 25, dpr: 100 }) });
    const weak = player({ stats: makeStats({ kd: 0.6, hsPct: 22, acc: 12, dpr: 50 }) });
    const r = simulateDuel({ mapId: "de_dust2", siteId: "mid", players: [strong, weak] });
    expect(r.winProbability[0]).toBeGreaterThan(r.winProbability[1]);
  });

  it("favors the CT on a CT-advantaged site when players are equal", () => {
    const r = simulateDuel({
      mapId: "de_inferno",
      siteId: "b", // ctAdvantage 0.62
      players: [player({ side: "CT" }), player({ side: "T" })],
    });
    expect(r.winProbability[0]).toBeGreaterThan(r.winProbability[1]);
  });

  it("lets weapon choice flip an otherwise even duel by range", () => {
    const long = simulateDuel({
      mapId: "de_dust2",
      siteId: "mid", // long range
      players: [player({ weaponId: "awp" }), player({ weaponId: "mp9" })],
    });
    const short = simulateDuel({
      mapId: "de_dust2",
      siteId: "b", // short range
      players: [player({ weaponId: "awp" }), player({ weaponId: "mp9" })],
    });
    expect(long.winProbability[0]).toBeGreaterThan(short.winProbability[0]);
  });

  it("uses the player's own map win rate as a tiebreaker", () => {
    const r = simulateDuel({
      mapId: "de_nuke",
      siteId: "a",
      players: [player({ mapWinRatePct: 70 }), player({ mapWinRatePct: 35 })],
    });
    expect(r.winProbability[0]).toBeGreaterThan(r.winProbability[1]);
  });

  it("reports the engagement range of the chosen site", () => {
    expect(simulateDuel({ mapId: "de_dust2", siteId: "b", players: [player(), player()] }).engagementRange).toBe("short");
    expect(simulateDuel({ mapId: "de_dust2", siteId: "mid", players: [player(), player()] }).engagementRange).toBe("long");
  });

  it("is deterministic — same input, same output", () => {
    const input = { mapId: "de_ancient", siteId: "a", players: [player({ weaponId: "awp", side: "CT" }), player({ weaponId: "ak47" })] } as const;
    const a = simulateDuel({ ...input, players: [...input.players] as [DuelPlayerInput, DuelPlayerInput] });
    const b = simulateDuel({ ...input, players: [...input.players] as [DuelPlayerInput, DuelPlayerInput] });
    expect(a.winProbability).toEqual(b.winProbability);
  });
});
