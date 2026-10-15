import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BookOpen, FilePlus2, LockKeyhole, X } from "lucide-react";
import { errorMessage, type BookContent, type PrivateBook } from "@/lib/books/private/model";
import { deletePrivateBook, listPrivateBooks, savePrivateBook } from "@/lib/books/private/storage";
import { useAppStore } from "@/store/app-store";

type Candidate = { book: PrivateBook; content: BookContent };
const control =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50";

export function PrivateShelf() {
  const ar = useAppStore((s) => s.lang) === "ar";
  const L = (a: string, e: string) => (ar ? a : e);
  const [books, setBooks] = useState<PrivateBook[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"reading" | "saving" | null>(null);
  const [progress, setProgress] = useState([0, 0]);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [remove, setRemove] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const job = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    void listPrivateBooks()
      .then((rows) => {
        if (mounted.current) setBooks(rows);
      })
      .catch((e) => {
        if (mounted.current) setError(errorMessage(e, ar));
      })
      .finally(() => {
        if (mounted.current) setLoaded(true);
      });
    return () => {
      mounted.current = false;
      abort.current?.abort();
    };
  }, [ar]);

  async function choose(file?: File) {
    if (!file || busy) return;
    setError("");
    setCandidate(null);
    setSaved(null);
    setProgress([0, 0]);
    setBusy("reading");
    const controller = new AbortController();
    const currentJob = ++job.current;
    const active = () => mounted.current && job.current === currentJob;
    abort.current = controller;
    try {
      const [{ importPdf }, { privatePdfOpener }] = await Promise.all([
        import("@/lib/books/private/pdf-import"),
        import("@/lib/books/private/pdf-client"),
      ]);
      controller.signal.throwIfAborted();
      const open = await privatePdfOpener();
      controller.signal.throwIfAborted();
      const next = await importPdf(file, open, controller.signal, (page, count) => {
        if (active()) setProgress([page, count]);
      });
      if (active() && !controller.signal.aborted) setCandidate(next);
    } catch (e) {
      if (active() && !controller.signal.aborted) setError(errorMessage(e, ar));
    } finally {
      if (active()) {
        setBusy(null);
        if (input.current) input.current.value = "";
      }
    }
  }

  function cancelImport() {
    job.current++;
    abort.current?.abort();
    setBusy(null);
    setCandidate(null);
    if (input.current) input.current.value = "";
  }

  async function save() {
    if (!candidate || busy) return;
    setBusy("saving");
    setError("");
    try {
      const savedId = await savePrivateBook(candidate.book, candidate.content);
      const rows = await listPrivateBooks();
      if (mounted.current) {
        setBooks(rows);
        setSaved(savedId);
        setCandidate(null);
      }
    } catch (e) {
      if (mounted.current) setError(errorMessage(e, ar));
    } finally {
      if (mounted.current) setBusy(null);
    }
  }

  async function confirmRemove(id: string) {
    setError("");
    try {
      await deletePrivateBook(id);
      setBooks(await listPrivateBooks());
      setRemove(null);
    } catch (e) {
      setError(errorMessage(e, ar));
    }
  }

  return (
    <section
      className="mb-10 rounded-2xl border border-primary/25 bg-surface p-4 sm:p-6"
      data-private-pdf-shelf="device-only"
    >
      <div className="flex items-center gap-2 text-sm text-primary">
        <LockKeyhole className="size-4" />
        {L("مكتبتك على هذا الجهاز", "Your on-device library")}
      </div>
      <h2 className="mt-2 font-display text-2xl">
        {L("كتابك، بخط مريح", "Your book, easier to read")}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {L(
          "أضف PDF تملك حق استخدامه. نستخرج النص على جهازك ليكبر الخط ويلائم الشاشة، مع الاحتفاظ بالنسخة الأصلية. لا نرفع الملف ولا ننشره.",
          "Add a PDF you may use. Text is extracted on your device for larger, responsive reading, while the original is kept. Files are never uploaded or published.",
        )}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        {L(
          "٢٥ ميغابايت · ٥٠٠ صفحة · حتى ٣٠ كتابًا. الملفات المصوّرة تبقى بصيغتها الأصلية؛ استخراج نص الصور غير متاح بعد. التخزين محلي وقد يُمسح مع بيانات المتصفح؛ احتفظ بنسختك. لا توجد مزامنة بين الأجهزة.",
          "25 MiB · 500 pages · up to 30 books. Scanned pages keep their original view; OCR is not available yet. Browser storage may be cleared: keep a backup. No cross-device sync.",
        )}
      </p>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        aria-label={L("اختر ملف PDF", "Choose a PDF")}
        className="sr-only"
        disabled={Boolean(busy)}
        onChange={(event) => {
          void choose(event.target.files?.[0]);
        }}
      />
      <button
        type="button"
        className={`${control} mt-4 bg-primary text-primary-fg`}
        disabled={!loaded || Boolean(busy)}
        onClick={() => input.current?.click()}
      >
        <FilePlus2 className="size-4" />
        {L("إضافة PDF من جهازي", "Add PDF from my device")}
      </button>
      {busy === "reading" && (
        <div className="mt-4 flex flex-wrap items-center gap-3" role="status">
          <span className="text-sm">
            {progress[1]
              ? L(
                  `قراءة الصفحة ${progress[0]} من ${progress[1]}`,
                  `Reading page ${progress[0]} of ${progress[1]}`,
                )
              : L("تجهيز القارئ محليًا…", "Preparing the local reader…")}
          </span>
          <button type="button" className={control} onClick={cancelImport}>
            <X className="size-4" />
            {L("إلغاء", "Cancel")}
          </button>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-600/30 bg-red-500/5 p-3 text-sm"
        >
          {error}
        </p>
      )}
      {candidate && (
        <div className="mt-5 rounded-xl border border-border p-4" data-import-preview="true">
          <label className="text-sm">
            {L("اسم الكتاب", "Book title")}
            <input
              maxLength={200}
              value={candidate.book.title}
              disabled={Boolean(busy)}
              onChange={(event) =>
                setCandidate({
                  ...candidate,
                  book: { ...candidate.book, title: event.target.value },
                })
              }
              className="mt-2 min-h-11 w-full rounded-lg border border-border bg-bg px-3"
            />
          </label>
          <p className="mt-3 text-sm text-muted">
            {L(
              `${candidate.book.pageCount} صفحة · نص متاح في ${candidate.book.textPages} صفحة`,
              `${candidate.book.pageCount} pages · text available on ${candidate.book.textPages} pages`,
            )}
          </p>
          <p className="mt-2 text-sm text-muted">
            {L(
              "راجع عينة النص. قد يختلف ترتيب الأعمدة والهوامش؛ ارجع إلى الأصل عند الشك. لا نضيف كلمات مفقودة.",
              "Review this sample. Columns and footnotes can be out of order; consult the original when unsure. Missing words are never generated.",
            )}
          </p>
          <div
            className="mt-3 max-h-52 overflow-auto rounded-lg bg-bg p-3 text-lg leading-loose"
            dir="auto"
          >
            {candidate.content.pages
              .find((page) => page.blocks.length)
              ?.blocks.slice(0, 3)
              .map((block) => <p key={block.id}>{block.text.slice(0, 600)}</p>) ??
              L(
                "لم نجد نصًا قابلًا للاستخراج. يمكنك حفظ الملف وقراءة صفحاته الأصلية.",
                "No extractable text was found. You can save and read the original pages.",
              )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className={`${control} bg-primary text-primary-fg`}
              type="button"
              disabled={Boolean(busy) || !candidate.book.title.trim()}
              onClick={() => {
                void save();
              }}
            >
              {busy === "saving"
                ? L("جارٍ الحفظ…", "Saving…")
                : L("حفظ في مكتبتي الخاصة", "Save to my private library")}
            </button>
            <button
              className={control}
              type="button"
              disabled={Boolean(busy)}
              onClick={() => setCandidate(null)}
            >
              {L("إلغاء", "Cancel")}
            </button>
          </div>
        </div>
      )}
      {saved && (
        <p role="status" className="mt-4 text-sm text-primary">
          {L("الكتاب محفوظ على هذا الجهاز.", "The book is saved on this device.")}{" "}
          <Link to="/books/read/$bookId" params={{ bookId: saved }} className="underline">
            {L("افتح القارئ", "Open reader")}
          </Link>
        </p>
      )}
      {!loaded && (
        <p role="status" className="mt-4 text-sm">
          {L("تحميل المكتبة…", "Loading library…")}
        </p>
      )}
      {loaded && !books.length && !candidate && (
        <p className="mt-4 text-sm text-muted">
          {L(
            "لم تضف ملفات بعد. تبدأ مكتبتك بأول كتاب تختاره.",
            "No files yet. Choose your first book to begin.",
          )}
        </p>
      )}
      <ul className="mt-5 grid gap-3">
        {books.map((book) => (
          <li key={book.id} className="rounded-xl border border-border p-3">
            <Link
              to="/books/read/$bookId"
              params={{ bookId: book.id }}
              className="flex min-h-11 items-start gap-3"
            >
              <BookOpen className="mt-1 size-5 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block break-words font-medium" dir="auto">
                  {book.title}
                </span>
                <span className="mt-1 block text-xs text-muted">
                  {L(
                    `${book.pageCount} صفحة · ${(book.bytes / 1024 / 1024).toFixed(1)} ميغابايت`,
                    `${book.pageCount} pages · ${(book.bytes / 1024 / 1024).toFixed(1)} MiB`,
                  )}
                </span>
              </span>
            </Link>
            {remove === book.id ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm">
                  {L(
                    "حذف الملف والنص وموضع القراءة من هذا الجهاز؟",
                    "Delete this file, text and reading position from this device?",
                  )}
                </span>
                <button
                  type="button"
                  className={control}
                  onClick={() => {
                    void confirmRemove(book.id);
                  }}
                >
                  {L("نعم، احذف", "Yes, delete")}
                </button>
                <button type="button" className={control} onClick={() => setRemove(null)}>
                  {L("تراجع", "Cancel")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="mt-2 min-h-11 text-sm text-muted underline"
                onClick={() => setRemove(book.id)}
              >
                {L("حذف من الجهاز", "Delete from device")}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
