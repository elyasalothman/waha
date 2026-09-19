import lock from "./maydan-seed-v1.json" with { type: "json" };
import full from "./maydan-seed-v1-full.json" with { type: "json" };
import type { SeedPost } from "./types.ts";

type KingSeedFile = {
  version: number;
  rules: { sampleNote: string };
  posts: SeedPost[];
  meta: { total: number; byBadge: Record<string, number> };
};

/** Official Maydan v1 — lock-format array and full+meta share the same 48 texts. */
export const SEED_FILE = full as KingSeedFile;
export const SEED_POSTS = (SEED_FILE.posts.length ? SEED_FILE.posts : (lock as SeedPost[]));

export const MIN_SEED_POSTS = 40;
