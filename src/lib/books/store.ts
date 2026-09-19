import { useMemo } from "react";
import { usePersistent } from "@/lib/storage";
import {
  EMPTY_KUTUBI,
  KUTUBI_STORAGE_KEY,
  addToKutubi,
  hydrateKutubi,
  listKutubiBooks,
  removeFromKutubi,
  requestPublicDraft,
  type KutubiState,
} from "./kutubi.ts";
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

export function useKutubi() {
  const [local, setLocal, ready] = usePersistent<KutubiState>(KUTUBI_STORAGE_KEY, EMPTY_KUTUBI);
  const state = useMemo(() => hydrateKutubi(local, BOOK_IDS), [local]);
  const books = useMemo(() => listKutubiBooks(state), [state]);

  const actions = useMemo(
    () => ({
      add: (id: string) => setLocal((prev) => addToKutubi(hydrateKutubi(prev, BOOK_IDS), id)),
      remove: (id: string) => setLocal((prev) => removeFromKutubi(hydrateKutubi(prev, BOOK_IDS), id)),
      requestPublic: (id: string) =>
        setLocal((prev) => requestPublicDraft(hydrateKutubi(prev, BOOK_IDS), id)),
    }),
    [setLocal],
  );

  return { books, local: state, ready, ...actions };
}
