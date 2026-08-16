// Faz 4: curated "featured comparisons" for the empty landing state.
//
// Deliberately ships EMPTY. Hardcoding well-known pro players' SteamIDs/vanity
// names from memory was tried and tested live against the real Steam API —
// most guesses resolved to random unrelated accounts (e.g. vanity "s1mple"
// resolved to an account named "plastic", "niko" to "Drakk"). Showing a
// stranger's profile under a celebrity's label would be both wrong and a
// minor privacy problem, so entries only belong here once verified.
//
// To add one: pick a SteamID64 or vanity name you can confirm is correct
// (open the profile on steamcommunity.com yourself, or test it against this
// app's own POST /api/steam and check the returned `player.name` matches),
// then add a row below. See docs/setup/faz-4-one-cikan-icerik.md.

export interface FeaturedComparison {
  id: string;
  /** SteamID64s or vanity names — same format the search box accepts. */
  players: string[];
  label: string;
}

export const FEATURED_COMPARISONS: FeaturedComparison[] = [];
