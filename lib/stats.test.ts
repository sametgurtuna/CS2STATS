import { describe, expect, it } from "vitest";
import {
  calcAccuracy,
  calcAwpRatio,
  calcDamagePerRound,
  calcHsPct,
  calcKD,
  calcMvpPerMatch,
  calcWinRate,
  computeBadges,
  computePlayerStats,
  computeWinProbability,
  deriveMaps,
  deriveWeapons,
  makeStatLookup,
} from "./stats";

describe("calcKD", () => {
  it("divides kills by deaths, rounded to 2 decimals", () => {
    expect(calcKD(150, 100)).toBe(1.5);
  });
  it("returns 0 when deaths is 0 (avoids division by zero)", () => {
    expect(calcKD(10, 0)).toBe(0);
  });
});

describe("calcHsPct", () => {
  it("computes headshot percentage", () => {
    expect(calcHsPct(200, 100)).toBe(50);
  });
  it("returns 0 when kills is 0", () => {
    expect(calcHsPct(0, 0)).toBe(0);
  });
});

describe("calcWinRate", () => {
  it("computes win rate from rounds", () => {
    expect(calcWinRate(55, 100)).toBe(55);
  });
  it("returns 0 when rounds is 0", () => {
    expect(calcWinRate(0, 0)).toBe(0);
  });
});

describe("calcAccuracy", () => {
  it("computes shots-hit / shots-fired percentage", () => {
    expect(calcAccuracy(20, 100)).toBe(20);
  });
  it("returns 0 when shotsFired is 0", () => {
    expect(calcAccuracy(0, 0)).toBe(0);
  });
});

describe("calcMvpPerMatch", () => {
  it("computes mvps per match", () => {
    expect(calcMvpPerMatch(50, 100)).toBe(0.5);
  });
  it("returns 0 when matchesPlayed is 0", () => {
    expect(calcMvpPerMatch(5, 0)).toBe(0);
  });
});

describe("calcDamagePerRound", () => {
  it("computes damage per round", () => {
    expect(calcDamagePerRound(8000, 100)).toBe(80);
  });
  it("returns 0 when damage is 0", () => {
    expect(calcDamagePerRound(0, 100)).toBe(0);
  });
  it("returns 0 when rounds is 0", () => {
    expect(calcDamagePerRound(500, 0)).toBe(0);
  });
});

describe("calcAwpRatio", () => {
  it("computes AWP kill ratio", () => {
    expect(calcAwpRatio(30, 100)).toBe(30);
  });
  it("returns 0 when totalKills is 0", () => {
    expect(calcAwpRatio(0, 0)).toBe(0);
  });
});

describe("makeStatLookup", () => {
  it("finds a value by stat name", () => {
    const v = makeStatLookup([{ name: "total_kills", value: 500 }]);
    expect(v("total_kills")).toBe(500);
  });
  it("returns 0 for a missing stat", () => {
    const v = makeStatLookup([]);
    expect(v("total_kills")).toBe(0);
  });
});

describe("deriveWeapons", () => {
  it("filters out zero-kill weapons and sorts descending by kills", () => {
    const v = makeStatLookup([
      { name: "total_kills_ak47", value: 100 },
      { name: "total_kills_awp", value: 300 },
      { name: "total_kills_deagle", value: 0 },
    ]);
    const weapons = deriveWeapons(v);
    expect(weapons.map((w) => w.name)).toEqual(["AWP", "AK-47"]);
  });
});

describe("deriveMaps", () => {
  it("filters out unplayed maps and computes win rate", () => {
    const v = makeStatLookup([
      { name: "total_wins_map_de_mirage", value: 10 },
      { name: "total_rounds_map_de_mirage", value: 20 },
      { name: "total_rounds_map_de_nuke", value: 0 },
    ]);
    const maps = deriveMaps(v);
    expect(maps).toEqual([{ name: "Mirage", wins: 10, rounds: 20, wr: 50 }]);
  });
});

describe("computeBadges", () => {
  it("assigns 'Casual Player' when no threshold is met", () => {
    const badges = computeBadges({ hsPct: 10, acc: 20, kills: 50, kd: 0.9, awpR: 0, winR: 40, dpr: 60 });
    expect(badges.map((b) => b.id)).toEqual(["average"]);
  });
  it("caps badges at 3 even when more thresholds are met", () => {
    const badges = computeBadges({ hsPct: 60, acc: 25, kills: 500, kd: 1.5, awpR: 40, winR: 60, dpr: 100 });
    expect(badges.length).toBe(3);
  });
});

describe("computePlayerStats", () => {
  it("derives the full PlayerStats shape from a raw Steam stat list", () => {
    const stats = computePlayerStats([
      { name: "total_kills", value: 1000 },
      { name: "total_deaths", value: 800 },
      { name: "total_kills_headshot", value: 400 },
      { name: "total_wins", value: 300 },
      { name: "total_rounds_played", value: 600 },
      { name: "total_shots_fired", value: 5000 },
      { name: "total_shots_hit", value: 1000 },
      { name: "total_mvps", value: 150 },
      { name: "total_matches_played", value: 100 },
      { name: "total_damage_done", value: 50000 },
      { name: "total_kills_awp", value: 100 },
    ]);

    expect(stats.kd).toBe(1.25);
    expect(stats.hsPct).toBe(40);
    expect(stats.winR).toBe(50);
    expect(stats.acc).toBe(20);
    expect(stats.mvpM).toBe(1.5);
    expect(stats.dpr).toBeCloseTo(83.3, 1);
    expect(stats.awpR).toBe(10);
    expect(stats.played).toBe(100);
  });
});

describe("computeWinProbability", () => {
  it("returns [] for an empty player list", () => {
    expect(computeWinProbability([])).toEqual([]);
  });

  it("gives an all-around-better player the higher score", () => {
    const better = { kd: 1.5, hsPct: 50, winR: 60, acc: 25, mvpM: 1.5, dpr: 90 };
    const worse = { kd: 0.8, hsPct: 30, winR: 40, acc: 15, mvpM: 0.5, dpr: 60 };
    const [a, b] = computeWinProbability([better, worse]);
    expect(a).toBeGreaterThan(b);
  });

  it("splits evenly for two identical players", () => {
    const same = { kd: 1, hsPct: 40, winR: 50, acc: 20, mvpM: 1, dpr: 80 };
    const [a, b] = computeWinProbability([same, same]);
    expect(a).toBeCloseTo(50, 5);
    expect(b).toBeCloseTo(50, 5);
  });

  it("normalizes to sum to 100 across N players", () => {
    const players = [
      { kd: 1.2, hsPct: 45, winR: 55, acc: 22, mvpM: 1.1, dpr: 85 },
      { kd: 0.9, hsPct: 35, winR: 45, acc: 18, mvpM: 0.8, dpr: 70 },
      { kd: 1.5, hsPct: 50, winR: 60, acc: 25, mvpM: 1.4, dpr: 95 },
    ];
    // Each score is independently rounded to 1 decimal, so the sum can drift
    // by a few tenths — assert it's close, not exact.
    const scores = computeWinProbability(players);
    expect(scores.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 0);
  });
});
