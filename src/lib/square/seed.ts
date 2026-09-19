import raw from "./maydan-seed-v1.json" with { type: "json" };
import type { SeedPost } from "./types.ts";

/** King-approved Maydan seed — loaded from bundled JSON, never an empty server. */
export const SEED_POSTS = raw as SeedPost[];

export const MIN_SEED_POSTS = 40;
