import cards from "./waha-kutub-shelf-cards-v1.json" with { type: "json" };
import seed from "./waha-kutub-shelf-seed-v1.json" with { type: "json" };
import {
  BOOK_SEED_SECTIONS,
  BOOK_SOURCE_KINDS,
  BOOK_STAMP,
  type BookCard,
  type BookSeedSection,
  type BookSourceKind,
} from "./types.ts";

export const BOOKS_SEED_COUNT = 12;

type SeedBook = BookCard & {
  lane: string;
  onMaydanFeed: boolean;
  pathHint: string;
  status: string;
  wave: number;
  paperPurchase: boolean;
};

type SeedFile = {
  version: number;
  title: string;
  approvedAt: string;
  status: string;
  replaces: string;
  lock: {
    route: string;
    door: string;
    outsideMaydanFeed: boolean;
    wave1NoPaperPurchase: boolean;
    oneCardPerTitle: boolean;
    arbaeenTwoOkIfDifferentBenefit: boolean;
    doNotModifySeed: boolean;
    buildAfter: string;
  };
  books: SeedBook[];
  meta: {
    count: number;
    bySection: Record<string, number>;
    dropped: string[];
  };
};

export const BOOKS_SEED = seed as SeedFile;

function asSection(value: string): BookSeedSection {
  if ((BOOK_SEED_SECTIONS as readonly string[]).includes(value)) return value as BookSeedSection;
  throw new Error(`books seed: unknown section ${value}`);
}

function asSourceKind(value: string): BookSourceKind {
  if ((BOOK_SOURCE_KINDS as readonly string[]).includes(value)) return value as BookSourceKind;
  throw new Error(`books seed: unknown sourceKind ${value}`);
}

function asCard(row: SeedBook | BookCard): BookCard {
  return {
    id: row.id,
    section: asSection(row.section),
    titleAr: row.titleAr,
    author: row.author,
    benefitAr: row.benefitAr,
    url: row.url,
    sourceLabel: row.sourceLabel,
    sourceKind: asSourceKind(row.sourceKind),
    stamp: row.stamp,
    legalNote: row.legalNote,
  };
}

/** King-approved cards — source of truth for `/books`. Seed file stays the lock. */
export const BOOK_CARDS: BookCard[] = (cards as BookCard[]).map(asCard);

export const BOOK_IDS = BOOK_CARDS.map((book) => book.id);

export function isAllowedBookHost(url: string): boolean {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return false;
  }
  return host === "islamhouse.com" || host === "nawawiyya.sunnaonline.org" || host === "midad.alhajda.com";
}

export { BOOK_STAMP };
