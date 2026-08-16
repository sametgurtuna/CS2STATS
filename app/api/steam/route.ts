import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import type { PlayerData } from '@/lib/types';
import { isValidPlayerInput } from '@/lib/validation';
import { getRatelimit, isRedisConfigured } from '@/lib/redis';
import { resolveSteamId } from '@/lib/steam';
import { fetchPlayerData, PlayerNotFoundError, SteamApiKeyError } from '@/lib/fetchPlayer';
import { getCached, setCached } from '@/lib/cache';

const CACHE_TTL_SECONDS = 300; // 5 minutes

export async function POST(request: Request) {
  try {
    if (isRedisConfigured()) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      const { success } = await getRatelimit().limit(ip);
      if (!success) {
        return NextResponse.json({ error: 'Too many requests. Please wait a moment and try again.' }, { status: 429 });
      }
    }

    const body = await request.json();
    const { player } = body;

    if (!process.env.STEAM_API_KEY) return NextResponse.json({ error: 'Server API key not configured.' }, { status: 500 });
    if (!player) return NextResponse.json({ error: 'Player info required.' }, { status: 400 });
    if (!isValidPlayerInput(player)) {
      return NextResponse.json({ error: 'Invalid Steam ID, vanity name, or profile URL format.' }, { status: 400 });
    }

    const cacheKey = `cs2stats:cache:${player.trim().toLowerCase()}`;
    const cached = await getCached<PlayerData>(cacheKey, CACHE_TTL_SECONDS);
    if (cached) return NextResponse.json(cached);

    const steamId = await resolveSteamId(player);
    if (!steamId) return NextResponse.json({ error: `Could not resolve "${player.trim()}".` }, { status: 404 });

    let data: PlayerData;
    try {
      data = await fetchPlayerData(steamId);
    } catch (e) {
      if (e instanceof PlayerNotFoundError) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
      if (e instanceof SteamApiKeyError) {
        Sentry.captureMessage('Steam API rejected key (403) on GetPlayerSummaries', 'error');
        return NextResponse.json({ error: 'Invalid API key.' }, { status: 403 });
      }
      throw e;
    }

    await setCached(cacheKey, data, CACHE_TTL_SECONDS);
    return NextResponse.json(data);
  } catch (e) {
    Sentry.captureException(e);
    const message = e instanceof Error ? e.message : 'Server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
