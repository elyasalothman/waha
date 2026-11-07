import midad from "./books/platform/midad.json" with { type: "json" };
import { continueReading, savedReading, type ContinueHit } from "./books/continue-reading.ts";

export type MidadCard = (typeof midad)[number];

type Store = { getItem(key: string): string | null };

export type ShelfVisibility = {
  continue: boolean;
  saved: boolean;
  reading: boolean;
  picks: boolean;
};

export function libraryHref(id: string) {
  return `/books/library/${id}`;
}

/** Dated catalog slot. Stable for a calendar day; not a shuffle. */
export function dailyMidad(now = Date.now()): MidadCard {
  return midad[Math.floor(now / 86400000) % midad.length]!;
}

/** Dated book, or the next catalog book when that one is already shown elsewhere. */
export function visibleDaily(occupied: ReadonlySet<string>, now = Date.now()): MidadCard | null {
  const start = Math.floor(now / 86400000) % midad.length;
  for (let step = 0; step < midad.length; step += 1) {
    const book = midad[(start + step) % midad.length]!;
    if (!occupied.has(libraryHref(book.id))) return book;
  }
  return null;
}

/**
 * One place per book. Continue wins, then saved, then the daily passage, then picks.
 * A hidden section does not reserve its books.
 */
export function homeShelfPlan(storage: Store, visible: ShelfVisibility, now = Date.now()) {
  const resume = visible.continue ? continueReading(storage) : [];
  const taken = new Set(resume.map((item) => item.href));
  const saved: ContinueHit[] = visible.saved
    ? savedReading(storage).filter((item) => !taken.has(item.href))
    : [];
  for (const item of saved) taken.add(item.href);
  const daily = visible.reading ? visibleDaily(taken, now) : null;
  if (daily) taken.add(libraryHref(daily.id));
  const picks = visible.picks
    ? midad.filter((book) => !taken.has(libraryHref(book.id))).slice(0, 3)
    : [];
  return { resume, saved, daily, picks };
}
