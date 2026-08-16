CREATE TABLE "follows" (
	"steam_id" text PRIMARY KEY NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"steam_id" text NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"kd" real NOT NULL,
	"hs_pct" real NOT NULL,
	"win_r" real NOT NULL,
	"acc" real NOT NULL,
	"dpr" real NOT NULL,
	"hours_played" integer NOT NULL,
	"raw" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"steam_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"avatar" text,
	"country" text,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_steam_id_players_steam_id_fk" FOREIGN KEY ("steam_id") REFERENCES "public"."players"("steam_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_snapshots" ADD CONSTRAINT "player_snapshots_steam_id_players_steam_id_fk" FOREIGN KEY ("steam_id") REFERENCES "public"."players"("steam_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "player_snapshots_steam_id_captured_at_idx" ON "player_snapshots" USING btree ("steam_id","captured_at");