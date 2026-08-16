import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { resolveSteamId, fetchSteamSummary } from "@/lib/steam";
import { fetchPlayerData, PlayerNotFoundError } from "@/lib/fetchPlayer";
import { getCached, setCached } from "@/lib/cache";
import { getSnapshots } from "@/lib/snapshots";
import { trackPlayerView } from "@/lib/tracking";
import { fetchFaceitStats, fetchFaceitMatchHistory, type FaceitLifetimeStats, type FaceitMatchSummary } from "@/lib/faceit";
import type { PlayerData } from "@/lib/types";
import PlayerView from "./PlayerView";

const CACHE_TTL_SECONDS = 300;
// FACEIT stats/history change slower than a live comparison — cache longer,
// and independently from the Steam-side PlayerData cache above.
const FACEIT_CACHE_TTL_SECONDS = 600;

// Faz 5: free tier shows the last 7 daily snapshots; full history is a
// planned Pro feature (see app/components/ProBadge.tsx — no real
// entitlement check exists yet, this is just what's currently shown).
const FREE_TIER_SNAPSHOT_DAYS = 7;

type Params = Promise<{ steamid: string }>;

async function loadPlayer(steamid: string): Promise<{ resolvedId: string; data: PlayerData } | null> {
  const resolvedId = await resolveSteamId(steamid);
  if (!resolvedId) return null;

  const cacheKey = `cs2stats:player:${resolvedId}`;
  const cached = await getCached<PlayerData>(cacheKey, CACHE_TTL_SECONDS);
  if (cached) return { resolvedId, data: cached };

  try {
    const data = await fetchPlayerData(resolvedId);
    await setCached(cacheKey, data, CACHE_TTL_SECONDS);
    return { resolvedId, data };
  } catch (e) {
    if (e instanceof PlayerNotFoundError) return null;
    throw e;
  }
}

async function loadFaceitExtras(faceitPlayerId: string): Promise<{ stats: FaceitLifetimeStats | null; matches: FaceitMatchSummary[] }> {
  const statsKey = `cs2stats:faceit:stats:${faceitPlayerId}`;
  const historyKey = `cs2stats:faceit:history:${faceitPlayerId}`;

  const [cachedStats, cachedMatches] = await Promise.all([
    getCached<FaceitLifetimeStats>(statsKey, FACEIT_CACHE_TTL_SECONDS),
    getCached<FaceitMatchSummary[]>(historyKey, FACEIT_CACHE_TTL_SECONDS),
  ]);

  const stats = cachedStats ?? (await fetchFaceitStats(faceitPlayerId));
  if (!cachedStats && stats) await setCached(statsKey, stats, FACEIT_CACHE_TTL_SECONDS);

  const matches = cachedMatches ?? (await fetchFaceitMatchHistory(faceitPlayerId, 8));
  if (!cachedMatches && matches.length) await setCached(historyKey, matches, FACEIT_CACHE_TTL_SECONDS);

  return { stats, matches };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { steamid } = await params;
  const resolvedId = await resolveSteamId(steamid);
  if (!resolvedId) return {};

  const summary = await fetchSteamSummary(resolvedId);
  if (!summary) return {};

  const title = `${summary.name} — CS2 Stats | CS2STATS`;
  const description = `${summary.name}'s Counter-Strike 2 stats: K/D, headshot %, win rate, and more.`;

  return {
    title,
    description,
    openGraph: { title, description, images: [summary.avatar] },
    twitter: { card: "summary", title, description, images: [summary.avatar] },
  };
}

export default async function PlayerPage({ params }: { params: Params }) {
  const { steamid } = await params;
  const result = await loadPlayer(steamid);
  if (!result) notFound();

  const { resolvedId, data } = result;

  after(async () => {
    await trackPlayerView(resolvedId, data.player.name, data.player.avatar, data.player.country);
  });

  const allSnapshots = await getSnapshots(resolvedId);
  const snapshots = allSnapshots.slice(-FREE_TIER_SNAPSHOT_DAYS);
  const hasMoreHistory = allSnapshots.length > FREE_TIER_SNAPSHOT_DAYS;

  const faceitExtras = data.faceit?.playerId ? await loadFaceitExtras(data.faceit.playerId) : { stats: null, matches: [] };

  return <PlayerView data={data} snapshots={snapshots} hasMoreHistory={hasMoreHistory} faceitStats={faceitExtras.stats} faceitMatches={faceitExtras.matches} />;
}
