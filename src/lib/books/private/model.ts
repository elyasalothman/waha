export const MAX_PDF_BYTES = 25 * 1024 * 1024;
export const MAX_PDF_PAGES = 500;
export const MAX_TEXT_CHARS = 2_000_000;
export const MAX_BOOKS = 30;

export type TextBlock = { id: string; text: string; direction: "rtl" | "ltr" };
export type BookPage = { number: number; blocks: TextBlock[]; review: boolean };
export type PrivateBook = {
  id: string;
  contentDigest: string;
  title: string;
  addedAt: number;
  bytes: number;
  pageCount: number;
  textPages: number;
  reviewPages: number;
  formatVersion: 1;
};
export type BookContent = { id: string; original: Blob; pages: BookPage[] };
export type ReadingAnchor = { page: number; block: string | null };
export type ReadingState = {
  id: string;
  anchor: ReadingAnchor;
  fontSize: number;
  theme: "paper" | "warm" | "night";
  bookmarks: ReadingAnchor[];
};

export function initialReading(id: string): ReadingState {
  return { id, anchor: { page: 1, block: null }, fontSize: 24, theme: "paper", bookmarks: [] };
}

export function safeReading(
  raw: ReadingState | undefined,
  id: string,
  pages: number,
): ReadingState {
  const base = initialReading(id);
  if (!raw) return base;
  const anchor = (value: ReadingAnchor): ReadingAnchor => ({
    page: Math.min(Math.max(1, Math.floor(value?.page) || 1), pages),
    block: typeof value?.block === "string" ? value.block.slice(0, 80) : null,
  });
  return {
    id,
    anchor: anchor(raw.anchor),
    fontSize: Math.min(40, Math.max(18, Number(raw.fontSize) || 24)),
    theme: ["paper", "warm", "night"].includes(raw.theme) ? raw.theme : "paper",
    bookmarks: Array.isArray(raw.bookmarks) ? raw.bookmarks.slice(0, 100).map(anchor) : [],
  };
}

export function normalizeSearch(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .toLocaleLowerCase();
}

export function searchPages(pages: BookPage[], query: string) {
  const needle = normalizeSearch(query.trim());
  if (needle.length < 2) return [];
  return pages
    .flatMap((page) =>
      page.blocks
        .filter((block) => normalizeSearch(block.text).includes(needle))
        .map((block) => ({ page: page.number, block: block.id, text: block.text })),
    )
    .slice(0, 100);
}

export type PdfTextItem = {
  str: string;
  dir: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL: boolean;
};

/** Keep PDF.js reading order and exact characters. Only join adjacent lines;
 * ambiguous geometry is flagged rather than silently inventing a new order. */
export function textPage(items: unknown[], number: number): BookPage {
  const spans = items.filter((item): item is PdfTextItem =>
    Boolean(item && typeof item === "object" && "str" in item),
  );
  const lines: {
    text: string;
    y: number;
    x: number;
    right: number;
    lastLeft: number;
    height: number;
    rtl: boolean;
  }[] = [];
  let line: (typeof lines)[number] | undefined;
  let review = false;
  const flush = () => {
    if (line?.text.trim()) lines.push(line);
    line = undefined;
  };
  for (const span of spans) {
    if (typeof span.str !== "string") continue;
    const matrix = span.transform ?? [];
    const x = Number(matrix[4]) || 0;
    const y = Number(matrix[5]) || 0;
    const height = Math.max(1, Math.abs(Number(span.height) || Number(matrix[3]) || 12));
    if (Math.abs(Number(matrix[1]) || 0) > 0.1 || Math.abs(Number(matrix[2]) || 0) > 0.1)
      review = true;
    if (line && Math.abs(y - line.y) > Math.max(2, height * 0.35)) flush();
    if (!line) line = { text: "", y, x, right: x, lastLeft: x, height, rtl: span.dir === "rtl" };
    const gap =
      span.dir === "rtl" ? line.lastLeft - (x + (Number(span.width) || 0)) : x - line.right;
    if (line.text && gap > height * 3) review = true;
    const needsSpace =
      line.text && !/\s$/.test(line.text) && !/^\s/.test(span.str) && gap > height * 0.2;
    line.text += (needsSpace ? " " : "") + span.str;
    line.right = x + (Number(span.width) || 0);
    line.lastLeft = x;
    line.rtl ||= span.dir === "rtl";
    if (span.hasEOL) flush();
  }
  flush();
  const blocks: TextBlock[] = [];
  let previous: (typeof lines)[number] | undefined;
  for (const row of lines) {
    const gap = previous ? previous.y - row.y : Infinity;
    if (previous && gap < -2) review = true;
    const direction = row.rtl || /[\u0600-\u06ff]/.test(row.text) ? "rtl" : "ltr";
    const last = blocks.at(-1);
    const canJoin =
      previous &&
      // A new base direction starts a new paragraph, even at normal line spacing.
      last?.direction === direction &&
      gap >= -2 &&
      gap < row.height * 1.65 &&
      Math.abs(row.x - previous.x) < row.height * 3;
    if (canJoin && last && last.text.length + row.text.length < 1200)
      last.text += " " + row.text.trim();
    else
      blocks.push({
        id: `p${number}-b${blocks.length}`,
        text: row.text.trim(),
        direction,
      });
    previous = row;
  }
  if (blocks.some((block) => /\uFFFD/.test(block.text))) review = true;
  return { number, blocks, review };
}

export function errorMessage(error: unknown, ar: boolean): string {
  const name = error instanceof Error ? error.name : "";
  const messages: Record<string, [string, string]> = {
    QuotaExceededError: [
      "مساحة الجهاز لا تكفي لحفظ الكتاب. حرّر مساحة ثم حاول مجددًا.",
      "Not enough device storage. Free some space and try again.",
    ],
    PasswordException: [
      "هذا الملف محمي بكلمة مرور. اختر نسخة غير محمية تملك حق استخدامها.",
      "This PDF is password-protected. Choose an unlocked copy you may use.",
    ],
    InvalidPDFException: [
      "تعذّر قراءة الملف. تأكد أنه PDF صالح وغير تالف.",
      "This PDF could not be read. It may be invalid or damaged.",
    ],
    PdfSizeError: ["الحد الحالي ٢٥ ميغابايت لكل PDF.", "The current limit is 25 MiB per PDF."],
    PdfPageLimitError: [
      "الحد الحالي ٥٠٠ صفحة لكل كتاب.",
      "The current limit is 500 pages per book.",
    ],
    PdfTextLimitError: [
      "نص هذا الملف أكبر من الحد الآمن حاليًا. جرّب جزءًا أصغر.",
      "This file has too much text for the current safe limit. Try a smaller part.",
    ],
    BookLimitError: [
      "وصلت إلى حد ٣٠ كتابًا على هذا الجهاز.",
      "You have reached the limit of 30 books on this device.",
    ],
    StorageUnavailableError: [
      "التخزين على هذا المتصفح غير متاح. لم يُحفظ الكتاب.",
      "Storage is unavailable in this browser. The book was not saved.",
    ],
    TimeoutError: [
      "استغرق الملف وقتًا طويلًا. جرّب ملفًا أصغر أو أبسط.",
      "Processing took too long. Try a smaller or simpler PDF.",
    ],
  };
  return (
    messages[name]?.[ar ? 0 : 1] ??
    (ar
      ? "تعذّرت العملية. لم نرسل ملفك إلى أي خدمة. حاول مجددًا."
      : "The operation failed. Your file was not sent to any service. Try again.")
  );
}

export function namedError(name: string): Error {
  return Object.assign(new Error(name), { name });
}
