// Player-input format checks, shared by app/page.tsx (client-side, fast
// feedback) and app/api/steam/route.ts (server-side, defense in depth).
// This only validates *shape* — resolving whether the ID/vanity actually
// exists still requires the Steam API round-trip.

export const STEAM_ID64_REGEX = /^7656119\d{10}$/;

const VANITY_URL_REGEX = /^[a-zA-Z0-9_-]{2,64}$/;

export function isValidPlayerInput(raw: string): boolean {
  const player = raw.trim();
  if (!player) return false;

  if (player.includes('steamcommunity.com/id/')) {
    const vanity = player.split('steamcommunity.com/id/')[1]?.split('/')[0]?.split('?')[0]?.trim();
    return Boolean(vanity && VANITY_URL_REGEX.test(vanity));
  }
  if (player.includes('steamcommunity.com/profiles/')) {
    const id = player.split('steamcommunity.com/profiles/')[1]?.split('/')[0]?.split('?')[0]?.trim();
    return Boolean(id && STEAM_ID64_REGEX.test(id));
  }
  if (STEAM_ID64_REGEX.test(player)) return true;

  // Bare vanity name (no URL prefix)
  return VANITY_URL_REGEX.test(player);
}
