import { BOOK_CARDS, BOOK_IDS } from "./seed.ts";
import {
  EMPTY_BOOKS,
  SEED_TO_UI_SECTION,
  type BookCard,
  type BookUiSection,
  type BooksLocalState,
} from "./types.ts";

export { BOOK_CARDS, BOOK_IDS };

/** Seed order only — no ranking, no shuffle, no recommendations. */
export function listBooks(cards: readonly BookCard[] = BOOK_CARDS): BookCard[] {
  return [...cards];
}

export function emptyBooks(): BooksLocalState {
  return { version: 1, seededIds: [], opened: [] };
}

export function hydrateBooksState(
  prev: BooksLocalState | null | undefined,
  seedIds: readonly string[] = BOOK_IDS,
): BooksLocalState {
  const ids = [...seedIds];
  const allowed = new Set(ids);
  if (!prev || prev.version !== 1) {
    return { version: 1, seededIds: ids, opened: [] };
  }
  return {
    version: 1,
    seededIds: ids,
    opened: prev.opened.filter((id) => allowed.has(id)),
  };
}

export function markOpened(state: BooksLocalState, id: string): BooksLocalState {
  if (!state.seededIds.includes(id) || state.opened.includes(id)) return state;
  return { ...state, opened: [...state.opened, id] };
}

export function isOpened(state: BooksLocalState, id: string): boolean {
  return state.opened.includes(id);
}

export function uiSectionOf(book: Pick<BookCard, "section">): BookUiSection {
  return SEED_TO_UI_SECTION[book.section];
}

export function booksByUiSection(
  cards: readonly BookCard[] = BOOK_CARDS,
): Array<{ section: BookUiSection; books: BookCard[] }> {
  const groups = new Map<BookUiSection, BookCard[]>();
  for (const section of ["أخلاق", "شرعي", "مداد"] as const) groups.set(section, []);
  for (const book of cards) {
    groups.get(uiSectionOf(book))?.push(book);
  }
  return [...groups].map(([section, books]) => ({ section, books }));
}

export { EMPTY_BOOKS };
