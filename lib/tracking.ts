// Records that a player's page was viewed (Faz 2). Upserts `players` and adds
// an anonymous `follows` row so the cron snapshot job (app/api/cron/snapshot)
// picks this steamId up going forward. Fails soft — a DB hiccup should never
// break the page render, so callers should invoke this via next/server's
// `after()` rather than awaiting it in the request path.

import * as Sentry from "@sentry/nextjs";
import { getDb, isDbConfigured } from "@/lib/db";
import { players, follows } from "@/db/schema";

export async function trackPlayerView(steamId: string, name: string, avatar: string, country: string): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    const db = getDb();
    await db
      .insert(players)
      .values({ steamId, name, avatar, country })
      .onConflictDoUpdate({
        target: players.steamId,
        set: { name, avatar, country, lastSeenAt: new Date() },
      });
    await db.insert(follows).values({ steamId }).onConflictDoNothing({ target: follows.steamId });
  } catch (e) {
    Sentry.captureException(e);
  }
}

/** Used by the cron snapshot job to enumerate steamIds to snapshot. */
export async function listFollowedSteamIds(): Promise<string[]> {
  if (!isDbConfigured()) return [];
  const db = getDb();
  const rows = await db.select({ steamId: follows.steamId }).from(follows);
  return rows.map((r) => r.steamId);
}
