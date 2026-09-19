import { BOOK_CARDS, BOOK_IDS } from "./seed.ts";
import type { BookCard } from "./types.ts";

/** Private device shelf — never the public council store. */
export const KUTUBI_STORAGE_KEY = "waha:kutubi:v1";

export const KUTUBI_PUBLIC_DRAFT_STATUS = "legal-review" as const;
export type KutubiPublicDraftStatus = typeof KUTUBI_PUBLIC_DRAFT_STATUS;

export type KutubiPublicDraft = {
  status: KutubiPublicDraftStatus;
  requestedAt: number;
};

export type KutubiItem = {
  bookId: string;
  addedAt: number;
  publicDraft?: KutubiPublicDraft;
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

/** Local draft only — never writes the public council shelf. */
export function requestPublicDraft(
  state: KutubiState,
  bookId: string,
  now = Date.now(),
  seedIds: readonly string[] = BOOK_IDS,
): KutubiState {
  if (kutubiPublishesToPublic()) return state;
  if (!seedIds.includes(bookId)) return state;
  return {
    ...state,
    items: state.items.map((item) => {
      if (item.bookId !== bookId) return item;
      if (item.publicDraft?.status === KUTUBI_PUBLIC_DRAFT_STATUS) return item;
      return { ...item, publicDraft: { status: KUTUBI_PUBLIC_DRAFT_STATUS, requestedAt: now } };
    }),
  };
}

export function publicDraftOf(state: KutubiState, bookId: string): KutubiPublicDraft | undefined {
  return state.items.find((item) => item.bookId === bookId)?.publicDraft;
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

function asDraft(raw: unknown): KutubiPublicDraft | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as { status?: unknown; requestedAt?: unknown };
  if (row.status !== KUTUBI_PUBLIC_DRAFT_STATUS) return undefined;
  return {
    status: KUTUBI_PUBLIC_DRAFT_STATUS,
    requestedAt: typeof row.requestedAt === "number" ? row.requestedAt : 0,
  };
}

function asItem(raw: unknown): KutubiItem | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as { bookId?: unknown; addedAt?: unknown; publicDraft?: unknown };
  if (typeof row.bookId !== "string" || !row.bookId) return null;
  const publicDraft = asDraft(row.publicDraft);
  return {
    bookId: row.bookId,
    addedAt: typeof row.addedAt === "number" ? row.addedAt : 0,
    ...(publicDraft ? { publicDraft } : {}),
  };
}
