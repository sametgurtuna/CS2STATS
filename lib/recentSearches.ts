// localStorage-backed recent comparison history (Faz 3). Client-only — every
// function is a no-op on the server (typeof window guard) so this is safe to
// import from anywhere without an SSR crash.

const STORAGE_KEY = "cs2stats:recent-searches";
const MAX_ITEMS = 8;

export interface RecentSearch {
  /** Raw inputs as typed (SteamID64/vanity/URL), same order as `names`. */
  players: string[];
  /** Resolved display names, for a readable history list. */
  names: string[];
  ts: number;
}

export function getRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(players: string[], names: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const key = players.map((p) => p.trim().toLowerCase()).join(",");
    const existing = getRecentSearches().filter((s) => s.players.map((p) => p.trim().toLowerCase()).join(",") !== key);
    const next = [{ players, names, ts: Date.now() }, ...existing].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage full/unavailable (private browsing etc) — not worth surfacing
  }
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
