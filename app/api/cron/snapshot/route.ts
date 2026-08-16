// Periodic snapshot job for Faz 2's trend tracking. Triggered by Vercel Cron
// (see vercel.json) once a day; can also be called manually with the
// CRON_SECRET bearer token for testing. Iterates every steamId in `follows`
// (populated by lib/tracking.ts whenever someone views a /player/[steamid]
// page), fetches fresh stats, and writes one player_snapshots row per player.
//
// Fails soft per-player — one player's fetch/DB error is captured to Sentry
// and skipped, same fail-soft convention as app/api/steam/route.ts.

import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { isDbConfigured } from "@/lib/db";
import { listFollowedSteamIds } from "@/lib/tracking";
import { writeSnapshot } from "@/lib/snapshots";
import { fetchPlayerData } from "@/lib/fetchPlayer";

export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured." }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 500 });
  }

  const steamIds = await listFollowedSteamIds();
  let written = 0;
  let skipped = 0;
  let failed = 0;

  for (const steamId of steamIds) {
    try {
      const data = await fetchPlayerData(steamId);
      if (!data.stats) {
        skipped++; // private profile, nothing to snapshot
        continue;
      }
      await writeSnapshot(steamId, data.stats, data.hours);
      written++;
    } catch (e) {
      Sentry.captureException(e);
      failed++;
    }
  }

  return NextResponse.json({ total: steamIds.length, written, skipped, failed });
}
