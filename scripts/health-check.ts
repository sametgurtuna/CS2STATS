// Faz 0 sanity check: confirms UPSTASH_REDIS_* and SUPABASE_DB_URL env vars are
// set and actually reachable, without touching any app code paths.
// Usage: npx tsx scripts/health-check.ts (after filling in .env.local)

import { isRedisConfigured, getRedis } from "../lib/redis";
import { isDbConfigured, getDb } from "../lib/db";
import { sql } from "drizzle-orm";

async function checkRedis() {
  if (!isRedisConfigured()) {
    console.log("⏭️  Redis: env vars not set, skipping.");
    return;
  }
  const redis = getRedis();
  const key = "cs2stats:health-check";
  await redis.set(key, Date.now());
  const value = await redis.get(key);
  console.log(value ? "✅ Redis: reachable." : "❌ Redis: set/get mismatch.");
}

async function checkDb() {
  if (!isDbConfigured()) {
    console.log("⏭️  Supabase DB: env var not set, skipping.");
    return;
  }
  const db = getDb();
  await db.execute(sql`select 1`);
  console.log("✅ Supabase DB: reachable.");
}

async function main() {
  await checkRedis();
  await checkDb();
}

main().catch((err) => {
  console.error("❌ Health check failed:", err);
  process.exit(1);
});
