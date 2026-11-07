/**
 * In-app games exercised in this review: start, one move or score, and restart.
 * Anything else stays routed but off the public games page.
 * Army is listed separately and is not filtered through this set.
 */
export const PUBLIC_GAME_IDS = [
  "xo",
  "memory",
  "snake",
  "merge2048",
  "reaction",
  "kalima",
] as const;

const PUBLIC = new Set<string>(PUBLIC_GAME_IDS);

export function isPublicGame(id: string): boolean {
  return PUBLIC.has(id);
}
