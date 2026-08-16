# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

CS2STATS: a single-page Next.js app that compares two Counter-Strike 2 players head-to-head. User enters two Steam IDs/vanity URLs/profile URLs, the app resolves them, fetches Steam (+ optional FACEIT) stats for both, and renders a side-by-side dashboard (radar chart, rings, weapon pie charts, map win rates, clutch stats, skins).

There is no database — everything is fetched live from Steam/FACEIT on each comparison, with a 5-minute in-memory cache in the API route (lost on server restart/redeploy, and per-instance on serverless).

## Commands

```bash
npm run dev     # start dev server (localhost:3000)
npm run build   # production build
npm run start   # run production build
npm run lint    # eslint (flat config, eslint-config-next core-web-vitals + typescript)
```

No test suite exists in this repo.

## Environment

Requires a `.env.local` (see `.env.example`):
- `STEAM_API_KEY` — required; requests fail with 500 if missing.
- `FACEIT_API_KEY` — optional; FACEIT level/ELO is simply omitted if unset.

## Architecture

Two files hold essentially all the logic:

- **`app/api/steam/route.ts`** — single `POST` handler that is the entire backend.
  1. Accepts `{ player: string }` — a raw SteamID64, a `steamcommunity.com/id/<vanity>` URL, or a `steamcommunity.com/profiles/<id>` URL — and resolves it to a SteamID64 (vanity names go through `ResolveVanityURL`).
  2. Fires off Steam `GetPlayerSummaries`, `GetUserStatsForGame` (appid 730), `GetOwnedGames`, and the public inventory endpoint in parallel via `axios` (plus FACEIT's player-by-game-id endpoint if `FACEIT_API_KEY` is set). All requests use a shared keep-alive `https.Agent` and fail soft (`.catch` returns a fake response object instead of throwing) so one failing endpoint doesn't kill the whole request.
  3. Derives every stat shown in the UI (K/D, HS%, win rate, accuracy, ADR/`dpr`, MVP/match, AWP kill ratio, per-weapon kills, per-map win rate, clutch stats) from the raw Steam stat blob via a small `v(name)` lookup helper — the raw stat names Steam returns are the source of truth, e.g. `total_kills_awp`, `total_wins_map_de_dust2`.
  4. Assigns cosmetic "badges" (Headshot Machine, Hard Carry, AWP God, etc.) from threshold rules over those derived stats.
  5. If the player's game stats are private (`GetUserStatsForGame` fails), still returns player/hours/skins/badges/faceit but `stats: null` — the frontend renders a "Profile Data Unavailable" state for this case rather than an error.
  6. Responses are cached in-process for 5 minutes keyed by the lowercased input string.

  When adding a new stat, add it to `WEAPON_STATS`/`MAP_STATS` (if it's per-weapon/per-map) or pull it via `v('steam_stat_name')`, then thread it through `finalResponse.stats`.

- **`app/page.tsx`** — single-page client component (`"use client"`) that is the entire frontend.
  - `Main` owns the two search inputs, calls the API for both players in parallel, and syncs `player1`/`player2` into the URL query string (`window.history.pushState`) so comparisons are shareable links — reloading with both params present auto-triggers a comparison on mount.
  - `Dashboard` (and its private helpers `Ring`, `StatBox`, `PlayerInfo`, `CmpRow`) is purely presentational: it takes the two API responses and renders every comparison widget. `CmpRow` and the radar chart independently recompute "who's better" per stat (higher-is-better, with a couple of explicit exceptions) purely for coloring/highlighting — there's no shared win-count logic between them and the top-level `winner` calculation in `Dashboard`.
  - Charts (`RadarChart`, `PieChart`) are from `recharts`; icons from `lucide-react`.
  - Player accent colors are hardcoded per-slot, not per-player: `p1Col = "#FF7B00"` (orange) always styles whichever player is in slot 1, `p2Col = "#00F0FF"` (cyan) always styles slot 2.

- **`app/globals.css`** — Tailwind v4 (`@import "tailwindcss"`, `@theme inline` for custom tokens, no `tailwind.config.js`). Design tokens of note: `--color-t1/t2/t3` (text hierarchy), `--color-player1/player2` (the two comparison accent colors used throughout `page.tsx`), and reusable classes `.card`, `.fade-in`, `.shimmer` (loading skeletons), `.grow-bar`.

## Conventions to preserve

- Both main files are intentionally monolithic (one route, one page) — this is a small dashboard, not a candidate for premature splitting into many files unless it grows significantly.
- Stat derivation logic lives only in the API route; the frontend never recomputes raw Steam values, only comparison/coloring logic on already-derived numbers.
- External API calls should stay fail-soft (`.catch` → status object) so a single failing upstream (e.g. private inventory) degrades gracefully instead of 500ing the whole comparison.
