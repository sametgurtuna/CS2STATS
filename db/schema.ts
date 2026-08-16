import { pgTable, text, integer, real, timestamp, uuid, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

// Design-only for Faz 0 — these tables are not yet migrated/used by any route.
// Faz 2 runs the actual migration and starts writing to `playerSnapshots`/`follows`.
// Faz 5 adds `users`/`plans` once an auth decision is made.

export const players = pgTable(
  "players",
  {
    steamId: text("steam_id").primaryKey(),
    name: text("name").notNull(),
    avatar: text("avatar"),
    country: text("country"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  },
);

// One row per (steamId, capturedAt) — periodic snapshots powering Faz 2's trend charts.
export const playerSnapshots = pgTable(
  "player_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    steamId: text("steam_id")
      .notNull()
      .references(() => players.steamId),
    capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow().notNull(),
    kd: real("kd").notNull(),
    hsPct: real("hs_pct").notNull(),
    winR: real("win_r").notNull(),
    acc: real("acc").notNull(),
    dpr: real("dpr").notNull(),
    hoursPlayed: integer("hours_played").notNull(),
    // Full derived-stats payload (PlayerStats shape from lib/types.ts) for fields
    // that don't need their own indexed column.
    raw: jsonb("raw").notNull(),
  },
  (table) => [uniqueIndex("player_snapshots_steam_id_captured_at_idx").on(table.steamId, table.capturedAt)],
);

// Steam IDs the cron job (Faz 2) should snapshot. Anonymous "follow" — no user
// association until Faz 5's auth decision lands.
export const follows = pgTable("follows", {
  steamId: text("steam_id")
    .primaryKey()
    .references(() => players.steamId),
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
});
