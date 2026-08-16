// Shared player color palette for the N-player comparison (Faz 3). Slot-based,
// same convention as the old hardcoded p1Col/p2Col: index in the `players`
// array picks the color, not anything about the player themselves.

export const PLAYER_COLORS = ["#FF7B00", "#00F0FF", "#A855F7", "#22C55E"] as const;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

export function colorFor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}
