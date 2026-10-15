export type Chapter = { title: string; paragraphs: string[] };
export type ReadingBook = {
  id: string;
  title: string;
  author: string;
  category: string;
  audience: string;
  cover: string;
  chapters: Chapter[];
};
export type BookSummary = Omit<ReadingBook, "chapters"> & { chapterCount: number; source?: string };
export const MAX_BOOK_CHARS = 1_000_000;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export function splitText(text: string): Chapter[] {
  const clean = text.replace(/\r\n?/g, "\n").replaceAll(String.fromCharCode(0), "").trim();
  if (!clean) throw new Error("لا يوجد نص قابل للقراءة. ملفات PDF المصوّرة تحتاج OCR قبل رفعها.");
  if (clean.length > MAX_BOOK_CHARS)
    throw new Error("النص أكبر من مليون حرف؛ قسّم الكتاب إلى أجزاء.");
  const chapters: Chapter[] = [];
  let current: Chapter = { title: "البداية", paragraphs: [] };
  for (const line of clean
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)) {
    if (/^(?:#{1,3}\s+|(?:الفصل|الباب|Chapter)\s+)/i.test(line) && line.length < 160) {
      if (current.paragraphs.length) chapters.push(current);
      current = { title: line.replace(/^#+\s*/, ""), paragraphs: [] };
    } else {
      // Bound paragraph length for mobile layouts and position restoration.
      for (let i = 0; i < line.length; i += 3000) current.paragraphs.push(line.slice(i, i + 3000));
      if (current.paragraphs.length >= 60) {
        chapters.push(current);
        current = { title: `متابعة ${chapters.length + 1}`, paragraphs: [] };
      }
    }
  }
  if (current.paragraphs.length) chapters.push(current);
  return chapters;
}

export function validateBook(value: unknown): ReadingBook {
  if (!value || typeof value !== "object") throw new Error("بيانات الكتاب غير صالحة.");
  const b = value as ReadingBook;
  for (const key of ["title", "author", "category", "audience"] as const) {
    if (typeof b[key] !== "string" || !b[key].trim() || b[key].length > 200)
      throw new Error("أكمل العنوان والمؤلف والتصنيف والعمر (حتى 200 حرف).");
  }
  if (
    typeof b.cover !== "string" ||
    (b.cover !== "" && !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(b.cover)) ||
    b.cover.length > 400_000
  )
    throw new Error("الغلاف يجب أن يكون صورة PNG أو JPEG أو WebP صغيرة.");
  if (!Array.isArray(b.chapters) || !b.chapters.length || b.chapters.length > 1000)
    throw new Error("عدد الفصول غير صالح.");
  let size = 0;
  const chapters = b.chapters.map((c) => {
    if (
      typeof c?.title !== "string" ||
      c.title.length > 200 ||
      !Array.isArray(c.paragraphs) ||
      !c.paragraphs.length ||
      c.paragraphs.some((p) => typeof p !== "string" || !p.trim())
    )
      throw new Error("الفصول غير صالحة.");
    size += c.title.length + c.paragraphs.reduce((n, p) => n + p.length, 0);
    return { title: c.title, paragraphs: c.paragraphs };
  });
  if (size > MAX_BOOK_CHARS || size === 0) throw new Error("حجم النص غير صالح.");
  return {
    id: typeof b.id === "string" ? b.id : "",
    title: b.title.trim(),
    author: b.author.trim(),
    category: b.category.trim(),
    audience: b.audience.trim(),
    cover: b.cover,
    chapters,
  };
}

export function summarize(book: ReadingBook): BookSummary {
  const { chapters, ...summary } = book;
  return { ...summary, chapterCount: chapters.length };
}

export function mayPublish(userId: string | undefined, allowedIds: string | undefined): boolean {
  return Boolean(
    userId &&
    allowedIds
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .includes(userId),
  );
}
