import { normalizeSearch } from "./private/model.ts";

export type CuratedChapter = {
  id: string;
  title: string;
  html: string;
  plainText: string;
  anchorIds: string[];
  searchBlocks?: { id: string; text: string }[];
};
export type CuratedBook = {
  title: string;
  subtitle: string;
  edition: string;
  coverUrl?: string;
  pdfUrl?: string;
  chapters: CuratedChapter[];
  anchorToChapter: Record<string, number>;
};
export type CuratedPosition = { chapter: number; anchor: string | null };
export type CuratedReading = CuratedPosition & {
  version: 1;
  fontSize: number;
  theme: "paper" | "warm" | "night";
  bookmarks: CuratedPosition[];
};
export const ALHAJDA_READING_KEY = "waha:curated:alhajda:edition1";

export function curatedPosition(raw: unknown, book: CuratedBook): CuratedPosition {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const candidate =
    typeof row.chapter === "number" && Number.isFinite(row.chapter) ? Math.floor(row.chapter) : 0;
  const chapter = Math.min(Math.max(0, candidate), Math.max(0, book.chapters.length - 1));
  const anchor =
    typeof row.anchor === "string" && book.chapters[chapter]?.anchorIds.includes(row.anchor)
      ? row.anchor
      : null;
  return { chapter, anchor };
}

export function curatedReading(raw: unknown, book: CuratedBook): CuratedReading {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const fontSize =
    typeof row.fontSize === "number" && Number.isFinite(row.fontSize)
      ? Math.min(40, Math.max(18, row.fontSize))
      : 24;
  const theme = row.theme === "warm" || row.theme === "night" ? row.theme : "paper";
  const seen = new Set<string>();
  const bookmarks: CuratedPosition[] = [];
  if (Array.isArray(row.bookmarks))
    for (const value of row.bookmarks.slice(0, 100)) {
      const position = curatedPosition(value, book);
      const key = `${position.chapter}:${position.anchor}`;
      if (!seen.has(key)) {
        seen.add(key);
        bookmarks.push(position);
      }
    }
  return { version: 1, ...curatedPosition(row, book), fontSize, theme, bookmarks };
}

export function searchCuratedBook(book: CuratedBook, query: string) {
  const needle = normalizeSearch(query.trim());
  const hits: { chapter: number; anchor: string | null; text: string }[] = [];
  if (needle.length < 2) return hits;
  for (const [chapter, content] of book.chapters.entries()) {
    const blocks = content.searchBlocks?.length
      ? content.searchBlocks
      : [{ id: "", text: content.plainText }];
    for (const block of blocks) {
      if (normalizeSearch(block.text).includes(needle))
        hits.push({ chapter, anchor: block.id || null, text: block.text });
      if (hits.length === 100) return hits;
    }
  }
  return hits;
}

export function chapterForAnchor(book: CuratedBook, anchor: string): number | null {
  if (!Object.hasOwn(book.anchorToChapter, anchor)) return null;
  const chapter = book.anchorToChapter[anchor];
  return Number.isInteger(chapter) && chapter >= 0 && chapter < book.chapters.length
    ? chapter
    : null;
}
