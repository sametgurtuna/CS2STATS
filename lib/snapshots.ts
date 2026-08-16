// Read/write access to player_snapshots (Faz 2 trend tracking). Writing
// happens from the cron job (app/api/cron/snapshot); reading happens from
// app/player/[steamid] to render the trend chart.

import * as Sentry from "@sentry/nextjs";
import { asc, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { playerSnapshots } from "@/db/schema";
import type { PlayerStats } from "@/lib/types";

export interface SnapshotPoint {
  capturedAt: string;
  kd: number;
  hsPct: number;
  winR: number;
  acc: number;
  dpr: number;
  hoursPlayed: number;
}

const MAX_SNAPSHOTS = 60;

export async function getSnapshots(steamId: string): Promise<SnapshotPoint[]> {
  if (!isDbConfigured()) return [];
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(playerSnapshots)
      .where(eq(playerSnapshots.steamId, steamId))
      .orderBy(asc(playerSnapshots.capturedAt))
      .limit(MAX_SNAPSHOTS);

    return rows.map((r) => ({
      capturedAt: r.capturedAt.toISOString(),
      kd: r.kd,
      hsPct: r.hsPct,
      winR: r.winR,
      acc: r.acc,
      dpr: r.dpr,
      hoursPlayed: r.hoursPlayed,
    }));
  } catch (e) {
    Sentry.captureException(e);
    return [];
  }
}

export async function writeSnapshot(steamId: string, stats: PlayerStats, hoursPlayed: number): Promise<void> {
  const db = getDb();
  await db.insert(playerSnapshots).values({
    steamId,
    kd: stats.kd,
    hsPct: stats.hsPct,
    winR: stats.winR,
    acc: stats.acc,
    dpr: stats.dpr,
    hoursPlayed,
    raw: stats,
  });
}
