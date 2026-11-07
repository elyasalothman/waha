import midad from "./platform/midad.json" with { type: "json" };
import { STORIES } from "./stories.ts";

export type ContinueHit = {
  href: string;
  title: string;
  detail: string;
  savedAt: number;
};

type Store = { getItem(key: string): string | null };

function record(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function whole(value: unknown, max: number): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > max) return null;
  return value;
}

function savedAt(row: Record<string, unknown>): number {
  return typeof row.savedAt === "string" && Number.isFinite(Date.parse(row.savedAt))
    ? Date.parse(row.savedAt)
    : 0;
}

function progressed(row: Record<string, unknown>, chapter: number): boolean {
  if (chapter > 0) return true;
  if (whole(row.paragraph, 5000) && Number(row.paragraph) > 0) return true;
  return Array.isArray(row.bookmarks) && row.bookmarks.length > 0;
}

const SHELF_KEY = "waha:reading-shelf";

function bookmarkCount(row: Record<string, unknown>): number {
  return Array.isArray(row.bookmarks) ? row.bookmarks.length : 0;
}

/** Books the reader marked, from the same keys the readers already write. */
export function savedReading(storage: Store): ContinueHit[] {
  const hits: ContinueHit[] = [];
  const push = (href: string, title: string, detail: string) => {
    if (!hits.some((item) => item.href === href)) hits.push({ href, title, detail, savedAt: 0 });
  };
  const shelf = record(storage.getItem(SHELF_KEY));
  const ids = Array.isArray(shelf) ? shelf : [];
  for (const id of ids) {
    if (typeof id !== "string") continue;
    const book = midad.find((item) => item.id === id);
    if (!book) continue;
    push(`/books/library/${book.id}`, book.title, "في رف القراءة على هذا الجهاز");
  }
  const marked: [string, string, string][] = [
    ["waha:curated:alhajda:edition1", "/books/alhajda", "الهجدة"],
    ["waha:curated:trading-guide:20261007", "/books/trading-guide", "دليل المضاربة والتداول في الأسهم الأمريكية"],
  ];
  for (const [key, href, title] of marked) {
    const row = record(storage.getItem(key));
    if (row && bookmarkCount(row) > 0) push(href, title, "موضع محفوظ في الكتاب");
  }
  for (const story of STORIES) {
    const row = record(storage.getItem(`waha:curated:story:${story.slug}`));
    if (row && bookmarkCount(row) > 0)
      push(`/books/stories/${story.slug}`, story.title, "موضع محفوظ في القصة");
  }
  return hits.slice(0, 4);
}

/** Latest in-progress books already stored by the readers. */

export function continueReading(storage: Store): ContinueHit[] {
  const hits: ContinueHit[] = [];
  const push = (href: string, title: string, detail: string, at: number) => {
    if (!hits.some((item) => item.href === href)) hits.push({ href, title, detail, savedAt: at });
  };
  const alhajda = record(storage.getItem("waha:curated:alhajda:edition1"));
  const alhajdaChapter = alhajda ? whole(alhajda.chapter, 5) : null;
  if (alhajda && alhajdaChapter !== null && progressed(alhajda, alhajdaChapter))
    push("/books/alhajda", "الهجدة", `الفصل ${alhajdaChapter + 1} من 6`, savedAt(alhajda));
  const guide = record(storage.getItem("waha:curated:trading-guide:20261007"));
  const guideChapter = guide ? whole(guide.chapter, 22) : null;
  if (guide && guideChapter !== null && progressed(guide, guideChapter))
    push(
      "/books/trading-guide",
      "دليل المضاربة والتداول في الأسهم الأمريكية",
      `الفصل ${guideChapter + 1}`,
      savedAt(guide),
    );
  for (const story of STORIES) {
    const row = record(storage.getItem(`waha:curated:story:${story.slug}`));
    const chapter = row ? whole(row.chapter, story.chapters - 1) : null;
    if (!row || chapter === null || !progressed(row, chapter)) continue;
    push(
      `/books/stories/${story.slug}`,
      story.title,
      `الفصل ${chapter + 1} من ${story.chapters}`,
      savedAt(row),
    );
  }
  for (const book of midad) {
    const row = record(storage.getItem(`waha:reading:${book.id}`));
    const chapter = row ? whole(row.chapter, book.chapterCount - 1) : null;
    if (!row || chapter === null || !progressed(row, chapter)) continue;
    push(
      `/books/library/${book.id}`,
      book.title,
      `الفصل ${chapter + 1} من ${book.chapterCount}`,
      savedAt(row),
    );
  }
  return hits.sort((a, b) => b.savedAt - a.savedAt || a.title.localeCompare(b.title, "ar")).slice(0, 3);
}
