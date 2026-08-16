// URL <-> N-player list helpers (Faz 3). Replaces the old fixed player1/player2
// query params with a single `players=a,b,c` param, while still reading the
// old scheme so links shared before Faz 3 keep working.

const PLAYERS_PARAM = "players";

export function parsePlayersParam(sp: URLSearchParams): string[] {
  const raw = sp.get(PLAYERS_PARAM);
  if (raw) {
    return raw
      .split(",")
      .map((s) => decodeURIComponent(s.trim()))
      .filter(Boolean);
  }
  // Backward compat: Faz 1/2 shared links used player1/player2.
  const legacy = [sp.get("player1"), sp.get("player2")].filter((x): x is string => Boolean(x));
  return legacy;
}

export function buildPlayersUrl(players: string[]): string {
  const u = new URL(window.location.href);
  u.searchParams.delete("player1");
  u.searchParams.delete("player2");
  u.searchParams.set(PLAYERS_PARAM, players.map((p) => encodeURIComponent(p)).join(","));
  return u.toString();
}
