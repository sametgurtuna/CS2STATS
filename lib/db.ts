import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

// Lazy singleton, same reasoning as lib/redis.ts — importable before the env
// var exists, only throws when a query actually runs without it configured.

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.SUPABASE_DB_URL);
}

export function getDb() {
  if (!dbInstance) {
    if (!isDbConfigured()) {
      throw new Error("SUPABASE_DB_URL not configured.");
    }
    const client = postgres(process.env.SUPABASE_DB_URL!, { prepare: false });
    dbInstance = drizzle(client, { schema });
  }
  return dbInstance;
}
