import index from "./stories/index.json" with { type: "json" };
import type { CuratedBook } from "./curated.ts";

/** سلسلة «قصص غموض» — مولّدة من /workspace/work/books/stories/build_stories.py (المصدر نفسه لمداد). */
export type StoryShelf = "mystery-novella" | "mystery-flash";
export type StoryEntry = {
  slug: string;
  shelf: StoryShelf;
  title: string;
  subtitle: string;
  author: string;
  hook: string;
  chapters: number;
  minutes: number;
  publishedAt: string;
  writtenBy: string;
  reviewedBy: string | null;
};

export const STORY_SHELF_LABEL: Record<StoryShelf, string> = {
  "mystery-novella": "رواية قصيرة",
  "mystery-flash": "قصص قصيرة جداً",
};

export const STORIES: StoryEntry[] = (index.items as StoryEntry[]).filter(
  (item) => item.shelf === "mystery-novella" || item.shelf === "mystery-flash",
);

export function storyBySlug(slug: string): StoryEntry | undefined {
  return STORIES.find((item) => item.slug === slug);
}

/** One lazy chunk per story. Add a line here when a new story JSON is added (stories.test.ts checks it). */
export const STORY_LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  "al-dalla": () => import("./stories/al-dalla.json"),
  "flash-1": () => import("./stories/flash-1.json"),
};

export async function loadStory(slug: string): Promise<CuratedBook | null> {
  if (!storyBySlug(slug) || !/^[a-z0-9-]+$/.test(slug)) return null;
  const load = STORY_LOADERS[slug];
  if (!load) return null;
  return (await load()).default as CuratedBook;
}
