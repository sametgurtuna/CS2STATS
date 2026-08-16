// Generic Redis-backed cache with an in-memory fallback, shared by
// app/api/steam/route.ts and app/player/[steamid]/page.tsx (Faz 2). Callers
// namespace their own keys (e.g. `cs2stats:cache:`, `cs2stats:player:`) so a
// single in-memory Map here is safe to share across call sites.

import * as Sentry from "@sentry/nextjs";
import { getRedis, isRedisConfigured } from "@/lib/redis";

const memoryCache = new Map<string, { time: number; data: unknown }>();

export async function getCached<T>(key: string, ttlSeconds: number): Promise<T | null> {
  if (isRedisConfigured()) {
    try {
      return (await getRedis().get<T>(key)) ?? null;
    } catch (e) {
      Sentry.captureException(e);
      return null;
    }
  }
  const hit = memoryCache.get(key);
  if (hit && Date.now() - hit.time < ttlSeconds * 1000) return hit.data as T;
  return null;
}

export async function setCached<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  if (isRedisConfigured()) {
    try {
      await getRedis().set(key, data, { ex: ttlSeconds });
      return;
    } catch (e) {
      Sentry.captureException(e);
      // fall through to memory cache so a Redis hiccup doesn't break the response
    }
  }
  memoryCache.set(key, { time: Date.now(), data });
}
