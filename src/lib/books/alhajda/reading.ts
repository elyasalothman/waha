import { ARABIC_READING_WORDS_PER_MINUTE } from "../curated.ts";

/** Section ids in document order. Pagination follows these authored pages. */
export function sectionIds(html: string): string[] {
  return [...html.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);
}

/** The authored page that contains an anchor, or the first page. */
export function pageForAnchor(html: string, anchor: string | null): string | null {
  const ids = sectionIds(html);
  if (!ids.length) return null;
  if (anchor && ids.includes(anchor)) return anchor;
  if (anchor) {
    const at = html.indexOf(`id="${anchor}"`);
    if (at >= 0) {
      const prior = [...html.slice(0, at).matchAll(/<section\b[^>]*\bid="([^"]+)"/g)];
      const container = prior.at(-1)?.[1];
      if (container && ids.includes(container)) return container;
    }
  }
  return ids[0];
}

export function readingMinutes(words: number | undefined): number | null {
  if (typeof words !== "number" || !Number.isFinite(words) || words <= 0) return null;
  return Math.max(1, Math.round(words / ARABIC_READING_WORDS_PER_MINUTE));
}
