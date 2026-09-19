import { useMemo } from "react";
import { usePersistent } from "@/lib/storage";
import { booksByUiSection, hydrateBooksState, listBooks, markOpened } from "./logic.ts";
import { BOOK_CARDS, BOOK_IDS } from "./seed.ts";
import { BOOKS_STORAGE_KEY, type BooksLocalState } from "./types.ts";

export { BOOKS_STORAGE_KEY };

const INITIAL: BooksLocalState = {
  version: 1,
  seededIds: [...BOOK_IDS],
  opened: [],
};

export function useBooks() {
  const [local, setLocal, ready] = usePersistent<BooksLocalState>(BOOKS_STORAGE_KEY, INITIAL);

  const books = useMemo(() => listBooks(BOOK_CARDS), []);
  const sections = useMemo(() => booksByUiSection(BOOK_CARDS), []);
  const state = useMemo(() => hydrateBooksState(local, BOOK_IDS), [local]);

  const actions = useMemo(
    () => ({
      markOpened: (id: string) => setLocal((prev) => markOpened(hydrateBooksState(prev, BOOK_IDS), id)),
    }),
    [setLocal],
  );

  return { books, sections, local: state, ready, ...actions };
}
