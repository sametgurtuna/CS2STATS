import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Not used for data queries (Drizzle in lib/db.ts handles those against the
// same Supabase Postgres instance) — this client is for Supabase-specific
// features Drizzle doesn't cover: Auth (Faz 5) and, if ever needed, Storage.

let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    if (!isSupabaseConfigured()) {
      throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY not configured.");
    }
    supabaseInstance = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  }
  return supabaseInstance;
}
