import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { isValidPlayerInput } from "@/lib/validation";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/** Faz 3: `players=a,b,c,...` is the current scheme; `player1`/`player2` from
 * Faz 1/2 links still works so old shares keep resolving. */
function parseSearchPlayers(sp: Awaited<SearchParams>): string[] {
  const raw = typeof sp.players === "string" ? sp.players : undefined;
  if (raw) return raw.split(",").map((s) => decodeURIComponent(s.trim())).filter(Boolean);

  const player1 = typeof sp.player1 === "string" ? sp.player1 : undefined;
  const player2 = typeof sp.player2 === "string" ? sp.player2 : undefined;
  return [player1, player2].filter((x): x is string => Boolean(x));
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  const players = parseSearchPlayers(sp);

  if (players.length < 2 || players.some((p) => !isValidPlayerInput(p))) {
    // No (valid) comparison in the URL — fall back to the static root metadata
    // (title/description/og-image) defined in app/layout.tsx.
    return {};
  }

  const title = `${players.join(" vs ")} — CS2STATS`;
  const description = "Head-to-head Counter-Strike 2 stats comparison — K/D, headshot %, win rate, AWP stats, and more.";
  // The OG image card only has room for two players — the first two in the list.
  const ogImage = `/api/og?player1=${encodeURIComponent(players[0])}&player2=${encodeURIComponent(players[1])}`;

  return {
    title,
    description,
    openGraph: { title, description, images: [ogImage] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default function Page() {
  return <HomeClient />;
}
