import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { resolveSteamId, fetchSteamSummary } from "@/lib/steam";
import { fetchPlayerData, PlayerNotFoundError } from "@/lib/fetchPlayer";
import { getCached, setCached } from "@/lib/cache";
import { getSnapshots } from "@/lib/snapshots";
import { trackPlayerView } from "@/lib/tracking";
import type { PlayerData } from "@/lib/types";
import PlayerView from "./PlayerView";

const CACHE_TTL_SECONDS = 300;

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

  const snapshots = await getSnapshots(resolvedId);

  return <PlayerView data={data} snapshots={snapshots} />;
}
