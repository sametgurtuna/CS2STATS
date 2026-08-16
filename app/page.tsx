import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { isValidPlayerInput } from "@/lib/validation";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  const player1 = typeof sp.player1 === "string" ? sp.player1 : undefined;
  const player2 = typeof sp.player2 === "string" ? sp.player2 : undefined;

  if (!player1 || !player2 || !isValidPlayerInput(player1) || !isValidPlayerInput(player2)) {
    // No (valid) comparison in the URL — fall back to the static root metadata
    // (title/description/og-image) defined in app/layout.tsx.
    return {};
  }

  const title = `${player1} vs ${player2} — CS2STATS`;
  const description = "Head-to-head Counter-Strike 2 stats comparison — K/D, headshot %, win rate, AWP stats, and more.";
  const ogImage = `/api/og?player1=${encodeURIComponent(player1)}&player2=${encodeURIComponent(player2)}`;

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
