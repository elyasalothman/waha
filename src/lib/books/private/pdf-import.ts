import {
  MAX_PDF_BYTES,
  MAX_PDF_PAGES,
  MAX_TEXT_CHARS,
  namedError,
  textPage,
  type BookContent,
  type PrivateBook,
} from "./model.ts";

export interface PdfDocument {
  numPages: number;
  getPage(
    number: number,
  ): Promise<{ getTextContent(): Promise<{ items: unknown[] }>; cleanup(): unknown }>;
}
export interface PdfTask {
  promise: Promise<PdfDocument>;
  destroy(): Promise<void>;
}
export type OpenPdf = (bytes: Uint8Array) => PdfTask;

export async function importPdf(
  file: File,
  openPdf: OpenPdf,
  signal: AbortSignal,
  progress: (page: number, count: number) => void,
) {
  if (file.size === 0 || file.size > MAX_PDF_BYTES) throw namedError("PdfSizeError");
  signal.throwIfAborted();
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (!new TextDecoder().decode(bytes.slice(0, 1024)).includes("%PDF-"))
    throw namedError("InvalidPDFException");
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  // Fingerprints stay inside IndexedDB. URLs contain only a random local ID.
  const contentDigest = Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
  const id = crypto.randomUUID();
  signal.throwIfAborted();
  const task = openPdf(bytes);
  const abort = () => {
    void task.destroy().catch(() => undefined);
  };
  signal.addEventListener("abort", abort, { once: true });
  let timeout = false;
  const timer = setTimeout(() => {
    timeout = true;
    abort();
  }, 120_000);
  try {
    const pdf = await task.promise;
    if (pdf.numPages > MAX_PDF_PAGES) throw namedError("PdfPageLimitError");
    const pages: BookContent["pages"] = [];
    let chars = 0;
    for (let number = 1; number <= pdf.numPages; number++) {
      signal.throwIfAborted();
      if (timeout) throw namedError("TimeoutError");
      const page = await pdf.getPage(number);
      try {
        const text = await page.getTextContent();
        const extracted = textPage(text.items, number);
        chars += extracted.blocks.reduce((sum, block) => sum + block.text.length, 0);
        if (chars > MAX_TEXT_CHARS) throw namedError("PdfTextLimitError");
        pages.push(extracted);
      } finally {
        page.cleanup();
      }
      progress(number, pdf.numPages);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    signal.throwIfAborted();
    const book: PrivateBook = {
      id,
      contentDigest,
      title: file.name.replace(/\.pdf$/i, "").slice(0, 200) || "PDF",
      addedAt: Date.now(),
      bytes: file.size,
      pageCount: pdf.numPages,
      textPages: pages.filter((page) => page.blocks.length).length,
      reviewPages: pages.filter((page) => page.review).length,
      formatVersion: 1,
    };
    return {
      book,
      content: {
        id,
        original: file.slice(0, file.size, "application/pdf"),
        pages,
      } satisfies BookContent,
    };
  } catch (error) {
    if (signal.aborted) throw signal.reason;
    if (timeout) throw namedError("TimeoutError");
    throw error;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
    await task.destroy().catch(() => undefined);
  }
}
