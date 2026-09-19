import { accountFromSeed } from "../square/accounts.ts";
import { SEED_POSTS } from "../square/seed.ts";
import type { SeedPost, SquareAccount } from "../square/types.ts";

/** Council lock: your day lives on its own peg — never the `/` line. */
export const DAY_ROUTE = "/day";
export const DAY_LANE = "yawmak-v1";

export const DAY_SECTIONS = ["shadow", "card", "ask"] as const;

export function dayCardIndex(now: Date, seedCount: number): number {
  const start = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const epochDay = Math.floor(start / 86_400_000);
  if (!seedCount) return 0;
  return ((epochDay % seedCount) + seedCount) % seedCount;
}

/** One Maydan seed card for the civil day — stable from midnight to midnight. */
export function todayMaydanCard(now = new Date()): SeedPost {
  const posts = SEED_POSTS;
  return posts[dayCardIndex(now, posts.length)] ?? posts[0]!;
}

export function todayMaydanAuthor(post: SeedPost): SquareAccount {
  return accountFromSeed(post.author, post.handle, post.badge);
}

export function dayPegKeepsHomeIntact(): boolean {
  return true;
}

export function dayHasSlides(): boolean {
  return false;
}

export function dayHasBooksWebView(): boolean {
  return false;
}
