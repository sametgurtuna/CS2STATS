import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Lazily-created singletons so this module can be imported even when the
// Upstash env vars aren't set yet (e.g. local dev before Faz 1 wires them up).
// Callers must check `isRedisConfigured()` before relying on `redis`/`ratelimit`.

let redisInstance: Redis | null = null;
let ratelimitInstance: Ratelimit | null = null;

export function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export function getRedis(): Redis {
  if (!redisInstance) {
    if (!isRedisConfigured()) {
      throw new Error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not configured.");
    }
    redisInstance = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redisInstance;
}

// IP-based sliding window rate limiter: 10 requests / minute.
// Not yet wired into any route — that happens in Faz 1.
export function getRatelimit(): Ratelimit {
  if (!ratelimitInstance) {
    ratelimitInstance = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      prefix: "cs2stats:ratelimit",
    });
  }
  return ratelimitInstance;
}
