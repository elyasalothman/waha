import { BOOK_CARDS, BOOK_IDS } from "./seed.ts";
import type { BookCard } from "./types.ts";

/** Private device shelf — never the public council store. */
export const KUTUBI_STORAGE_KEY = "waha:kutubi:v1";

export type KutubiItem = {
  bookId: string;
  addedAt: number;
};

export type KutubiState = {
  version: 1;
  items: KutubiItem[];
};

export const EMPTY_KUTUBI: KutubiState = { version: 1, items: [] };

/** Guest reads the public shelf. An account owns كتبي. */
export function accountOwnsKutubi(input: {
  sliceChosen: boolean;
  signedInRealUser: boolean;
}): boolean {
  return input.sliceChosen === true || input.signedInRealUser === true;
}

/** Hard lock: كتبي never leaves this device. */
export function kutubiPublishesToPublic(): boolean {
  return false;
}

export function hydrateKutubi(
  prev: KutubiState | null | undefined,
  seedIds: readonly string[] = BOOK_IDS,
): KutubiState {
  if (!prev || prev.version !== 1 || !Array.isArray(prev.items)) {
    return { version: 1, items: [] };
  }
  const allowed = new Set(seedIds);
  const seen = new Set<string>();
  const items: KutubiItem[] = [];
  for (const raw of prev.items) {
    const item = asItem(raw);
    if (!item || !allowed.has(item.bookId) || seen.has(item.bookId)) continue;
    seen.add(item.bookId);
    items.push(item);
  }
  return { version: 1, items };
}

export function addToKutubi(
  state: KutubiState,
  bookId: string,
  now = Date.now(),
  seedIds: readonly string[] = BOOK_IDS,
): KutubiState {
  if (kutubiPublishesToPublic()) return state;
  if (!seedIds.includes(bookId)) return state;
  if (state.items.some((item) => item.bookId === bookId)) return state;
  return { ...state, items: [...state.items, { bookId, addedAt: now }] };
}

export function removeFromKutubi(state: KutubiState, bookId: string): KutubiState {
  if (!state.items.some((item) => item.bookId === bookId)) return state;
  return { ...state, items: state.items.filter((item) => item.bookId !== bookId) };
}

export function isOnKutubi(state: KutubiState, bookId: string): boolean {
  return state.items.some((item) => item.bookId === bookId);
}

export function listKutubiBooks(
  state: KutubiState,
  cards: readonly BookCard[] = BOOK_CARDS,
): BookCard[] {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const listed: BookCard[] = [];
  for (const item of state.items) {
    const card = byId.get(item.bookId);
    if (card) listed.push(card);
  }
  return listed;
}

function asItem(raw: unknown): KutubiItem | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as { bookId?: unknown; addedAt?: unknown };
  if (typeof row.bookId !== "string" || !row.bookId) return null;
  return {
    bookId: row.bookId,
    addedAt: typeof row.addedAt === "number" ? row.addedAt : 0,
  };
}
