export const BOOKS_STORAGE_KEY = "waha:books:v1";

/** Seed section names — do not rename; UI maps them to أخلاق / شرعي / مداد. */
export const BOOK_SEED_SECTIONS = ["أخلاق", "علم شرعي", "عام مفيد"] as const;
export type BookSeedSection = (typeof BOOK_SEED_SECTIONS)[number];

export const BOOK_UI_SECTIONS = ["أخلاق", "شرعي", "مداد"] as const;
export type BookUiSection = (typeof BOOK_UI_SECTIONS)[number];

export const BOOK_SOURCE_KINDS = [
  "islamic-publisher-portal",
  "islamic-text-site",
  "midad-original",
] as const;
export type BookSourceKind = (typeof BOOK_SOURCE_KINDS)[number];

export const BOOK_STAMP = "كتاب مفيد · مصدر معلَّم";

export type BookCard = {
  id: string;
  section: BookSeedSection;
  titleAr: string;
  author: string;
  benefitAr: string;
  url: string;
  sourceLabel: string;
  sourceKind: BookSourceKind;
  stamp: string;
  legalNote: string;
};

export type BooksLocalState = {
  version: 1;
  seededIds: string[];
  opened: string[];
};

export const EMPTY_BOOKS: BooksLocalState = {
  version: 1,
  seededIds: [],
  opened: [],
};

export const SEED_TO_UI_SECTION: Record<BookSeedSection, BookUiSection> = {
  أخلاق: "أخلاق",
  "علم شرعي": "شرعي",
  "عام مفيد": "مداد",
};
