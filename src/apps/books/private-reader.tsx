import { ReaderControls } from "./reader-controls";
import { Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { BookmarkPlus, Download, Minus, Plus } from "lucide-react";
import {
  errorMessage,
  initialReading,
  safeReading,
  searchPages,
  type BookContent,
  type PrivateBook,
  type ReadingAnchor,
  type ReadingState,
} from "@/lib/books/private/model";
import { getPrivateBook, saveReading } from "@/lib/books/private/storage";
import { useAppStore } from "@/store/app-store";
import { firstVisibleReadingAnchor, useReaderLayout } from "./reader-layout";
import "./reader-layout.css";

const OriginalPage = lazy(() =>
  import("./original-page").then((module) => ({ default: module.OriginalPage })),
);
const control =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-current/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40";

export function PrivateReader({ bookId }: { bookId: string }) {
  const ar = useAppStore((s) => s.lang) === "ar";
  const L = (a: string, e: string) => (ar ? a : e);
  const [book, setBook] = useState<PrivateBook | null>(null);
  const [content, setContent] = useState<BookContent | null>(null);
  const [state, setState] = useState<ReadingState>(() => initialReading(bookId));
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [mode, setMode] = useState<"text" | "original">("text");
  const [query, setQuery] = useState("");
  const [showMarks, setShowMarks] = useState(false);
  const { reader, toolbar, getViewport, scrollTo, controlsVisible, toggleControls } =
    useReaderLayout(loaded && Boolean(book));
  const article = useRef<HTMLElement>(null);
  const pendingAnchor = useRef<ReadingAnchor | null>(null);
  const latest = useRef(state);
  latest.current = state;

  useEffect(() => {
    let active = true;
    setLoaded(false);
    setBook(null);
    setContent(null);
    setError("");
    void getPrivateBook(bookId)
      .then((result) => {
        if (!active) return;
        if (!result.book || !result.content) {
          setLoaded(true);
          return;
        }
        const reading = safeReading(result.reading, bookId, result.book.pageCount);
        setBook(result.book);
        setContent(result.content);
        setState(reading);
        pendingAnchor.current = reading.anchor;
        setMode(result.book.textPages ? "text" : "original");
        setLoaded(true);
      })
      .catch((e) => {
        if (active) {
          setError(errorMessage(e, ar));
          setLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [bookId, ar]);

  useEffect(() => {
    if (!loaded || !book) return;
    const timer = setTimeout(() => {
      void saveReading(state)
        .then(() => setSaveError(""))
        .catch((e) => setSaveError(errorMessage(e, ar)));
    }, 250);
    return () => clearTimeout(timer);
  }, [state, loaded, book, ar]);

  useEffect(() => {
    if (!loaded || !book) return;
    const flush = () => {
      void saveReading(latest.current).catch(() => undefined);
    };
    document.addEventListener("visibilitychange", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      flush();
    };
  }, [loaded, book]);

  const page = content?.pages[state.anchor.page - 1];
  useEffect(() => {
    const anchor = pendingAnchor.current;
    if (!anchor || !article.current) return;
    const frame = requestAnimationFrame(async () => {
      const target = anchor.block ? document.getElementById(anchor.block) : article.current;
      await scrollTo(target ?? article.current);
      if (pendingAnchor.current === anchor) pendingAnchor.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [page, mode, state.fontSize, loaded, scrollTo]);

  useEffect(() => {
    if (!page || mode !== "text" || !article.current) return;
    const root = article.current;
    let frame = 0;
    const observe = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (pendingAnchor.current) return;
        const nodes = root.querySelectorAll<HTMLElement>("[data-reading-block]");
        const { top, bottom } = getViewport();
        const visible = firstVisibleReadingAnchor(nodes, top, bottom);
        if (visible)
          setState((current) =>
            current.anchor.block === visible.id
              ? current
              : { ...current, anchor: { page: page.number, block: visible.id } },
          );
      });
    };
    window.addEventListener("scroll", observe, { passive: true });
    return () => {
      window.removeEventListener("scroll", observe);
      cancelAnimationFrame(frame);
    };
  }, [page, mode, getViewport]);

  const hits = useMemo(() => searchPages(content?.pages ?? [], query), [content, query]);
  function go(anchor: ReadingAnchor) {
    pendingAnchor.current = anchor;
    setState((current) => ({ ...current, anchor }));
    setQuery("");
    // Same-page bookmarks still need an explicit scroll.
    if (anchor.page === state.anchor.page)
      requestAnimationFrame(async () => {
        await scrollTo(anchor.block ? document.getElementById(anchor.block) : article.current);
        if (pendingAnchor.current === anchor) pendingAnchor.current = null;
      });
  }
  function resize(change: number) {
    pendingAnchor.current = state.anchor;
    setState((current) => ({
      ...current,
      fontSize: Math.min(40, Math.max(18, current.fontSize + change)),
    }));
  }
  function bookmark() {
    setState((current) => {
      const exists = current.bookmarks.some(
        (mark) => mark.page === current.anchor.page && mark.block === current.anchor.block,
      );
      return exists || current.bookmarks.length >= 100
        ? current
        : { ...current, bookmarks: [...current.bookmarks, current.anchor] };
    });
    setShowMarks(true);
  }
  function download() {
    if (!content || !book) return;
    const url = URL.createObjectURL(content.original);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${book.title.replace(/[\\/]/g, "_")}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (!loaded)
    return (
      <p role="status">{L("تحميل كتابك من هذا الجهاز…", "Loading your book from this device…")}</p>
    );
  if (!book || !content || !page)
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="font-display text-2xl">
          {L("الكتاب غير موجود على هذا الجهاز", "Book not found on this device")}
        </h1>
        <p className="mt-3 text-muted">
          {error ||
            L(
              "الكتب المضافة لا تنتقل عبر الرابط. قد تكون على متصفح آخر أو حُذفت بيانات هذا المتصفح.",
              "Imported books do not travel with a link. It may be on another browser, or this browser’s data was cleared.",
            )}
        </p>
        <Link to="/books" className="mt-4 inline-flex min-h-11 items-center text-primary underline">
          {L("العودة إلى المكتبة", "Back to library")}
        </Link>
      </div>
    );
  const colors =
    state.theme === "night"
      ? { backgroundColor: "#28231e", color: "#f5ead6" }
      : state.theme === "warm"
        ? { backgroundColor: "#f7edda", color: "#30271f" }
        : { backgroundColor: "#fffef9", color: "#242b28" };
  return (
    <section
      ref={reader}
      style={colors}
      className="reader-layout mx-auto max-w-4xl rounded-2xl border border-current/10 p-4 sm:p-7"
      data-private-reader="local-v1"
      data-reader-theme={state.theme}
    >
      <ReaderControls visible={controlsVisible} onToggle={toggleControls} />
      <Link to="/books" className="inline-flex min-h-11 items-center text-sm underline">
        {L("العودة إلى المكتبة", "Back to library")}
      </Link>
      <h1 className="mt-2 break-words font-display text-3xl" dir="auto">
        {book.title}
      </h1>
      <p className="mt-2 text-xs opacity-70">
        {L(
          "نسختك الخاصة على هذا الجهاز · لا رفع للملف · لا مزامنة",
          "Your private on-device copy · No upload · No sync",
        )}
      </p>
      <div
        ref={toolbar}
        className="reader-toolbar mt-5 flex flex-wrap gap-2"
        aria-label={L("إعدادات القراءة", "Reading settings")}
      >
        <button
          type="button"
          className={control}
          aria-pressed={mode === "text"}
          onClick={() => setMode("text")}
        >
          {L("قراءة مريحة", "Comfort reading")}
        </button>
        <button
          type="button"
          className={control}
          aria-pressed={mode === "original"}
          onClick={() => setMode("original")}
        >
          {L("الملف الأصلي", "Original PDF")}
        </button>
        <button
          type="button"
          className={control}
          aria-label={L("تصغير الخط", "Smaller text")}
          disabled={state.fontSize <= 18}
          onClick={() => resize(-2)}
        >
          <Minus className="size-4" />
        </button>
        <output className="self-center text-sm tabular-nums" aria-live="polite">
          {state.fontSize}
        </output>
        <button
          type="button"
          className={control}
          aria-label={L("تكبير الخط", "Larger text")}
          disabled={state.fontSize >= 40}
          onClick={() => resize(2)}
        >
          <Plus className="size-4" />
        </button>
        <label className="sr-only" htmlFor="reader-theme">
          {L("لون القراءة", "Reading theme")}
        </label>
        <select
          id="reader-theme"
          className={`${control} bg-transparent`}
          value={state.theme}
          onChange={(event) =>
            setState({ ...state, theme: event.target.value as ReadingState["theme"] })
          }
        >
          <option value="paper">{L("ورق", "Paper")}</option>
          <option value="warm">{L("دافئ", "Warm")}</option>
          <option value="night">{L("ليل", "Night")}</option>
        </select>
        <button
          type="button"
          className={control}
          aria-pressed={state.theme === "night"}
          onClick={() =>
            setState((current) => ({
              ...current,
              theme: current.theme === "night" ? "paper" : "night",
            }))
          }
        >
          {L("وضع ليلي", "Night mode")}
        </button>
        <button type="button" className={control} onClick={bookmark}>
          <BookmarkPlus className="size-4" />
          {L("حفظ موضع", "Bookmark")}
        </button>
        <button type="button" className={control} onClick={download}>
          <Download className="size-4" />
          {L("حفظ PDF الأصلي", "Download original")}
        </button>
      </div>
      {saveError && (
        <p className="mt-3 text-sm" role="alert">
          {L("لم يُحفظ موضع القراءة: ", "Reading position was not saved: ")}
          {saveError}
        </p>
      )}
      <label className="mt-5 block text-sm" htmlFor="book-search">
        {L("بحث داخل النص المستخرج", "Search extracted text")}
      </label>
      <input
        id="book-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={L("اكتب كلمتك…", "Type a word…")}
        className="mt-2 min-h-11 w-full rounded-lg border border-current/20 bg-transparent px-3 text-base"
      />
      {query.trim().length >= 2 && (
        <div
          className="mt-2 max-h-64 overflow-auto rounded-lg border border-current/20 p-3"
          role="region"
          aria-label={L("نتائج البحث", "Search results")}
        >
          <p className="text-xs">
            {L(`${hits.length} نتيجة (حتى ١٠٠)`, `${hits.length} results (up to 100)`)}
          </p>
          {hits.map((hit) => (
            <button
              type="button"
              key={hit.block}
              className="block min-h-11 w-full border-b border-current/10 py-3 text-start"
              onClick={() => {
                setMode("text");
                go(hit);
              }}
            >
              <span className="text-xs opacity-70">
                {L(`صفحة ${hit.page}`, `Page ${hit.page}`)}
              </span>
              <span className="mt-1 block line-clamp-2" dir="auto">
                {hit.text}
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className={`${control} mt-3`}
        aria-expanded={showMarks}
        onClick={() => setShowMarks(!showMarks)}
      >
        {L(`المواضع المحفوظة (${state.bookmarks.length})`, `Bookmarks (${state.bookmarks.length})`)}
      </button>
      {showMarks && (
        <ul className="mt-2 grid gap-2">
          {state.bookmarks.map((mark, index) => (
            <li key={`${mark.page}-${mark.block}`} className="flex flex-wrap items-center gap-2">
              <button type="button" className={control} onClick={() => go(mark)}>
                {L(
                  `موضع ${index + 1} · صفحة ${mark.page}`,
                  `Bookmark ${index + 1} · page ${mark.page}`,
                )}
              </button>
              <button
                type="button"
                className="min-h-11 px-2 text-sm underline"
                onClick={() =>
                  setState({ ...state, bookmarks: state.bookmarks.filter((_, i) => i !== index) })
                }
              >
                {L("إزالة", "Remove")}
              </button>
            </li>
          ))}
        </ul>
      )}
      <nav
        className="my-6 flex flex-wrap items-center justify-between gap-3"
        aria-label={L("صفحات الكتاب", "Book pages")}
      >
        <button
          type="button"
          className={control}
          disabled={page.number <= 1}
          onClick={() => go({ page: page.number - 1, block: null })}
        >
          {L("السابقة", "Previous")}
        </button>
        <label className="flex items-center gap-2 text-sm">
          {L("الصفحة", "Page")}
          <select
            aria-label={L("انتقل إلى صفحة", "Go to page")}
            value={page.number}
            className="min-h-11 max-w-24 rounded-lg border border-current/20 bg-transparent px-2"
            onChange={(event) => go({ page: Number(event.target.value), block: null })}
          >
            {content.pages.map((p) => (
              <option key={p.number} value={p.number}>
                {p.number}
              </option>
            ))}
          </select>
          <span>/ {book.pageCount}</span>
        </label>
        <button
          type="button"
          className={control}
          disabled={page.number >= book.pageCount}
          onClick={() => go({ page: page.number + 1, block: null })}
        >
          {L("التالية", "Next")}
        </button>
      </nav>
      <article
        ref={article}
        className="reader-content"
        aria-label={L(`صفحة ${page.number}`, `Page ${page.number}`)}
      >
        {mode === "original" ? (
          <Suspense
            fallback={<p role="status">{L("تحميل عارض الصفحات…", "Loading page viewer…")}</p>}
          >
            <OriginalPage file={content.original} page={page.number} ar={ar} />
          </Suspense>
        ) : (
          <>
            <p className="mb-6 rounded-lg border border-current/15 p-3 text-xs leading-relaxed opacity-75">
              {page.review
                ? L(
                    "قد يكون ترتيب هذه الصفحة غير دقيق. راجع الأصل، خاصة الأعمدة والهوامش.",
                    "This page’s order may be inaccurate. Check the original, especially columns and footnotes.",
                  )
                : L(
                    "هذا العرض للنص المستخرج فقط؛ قد لا تظهر الصور أو النصوص المصوّرة، وقد يختلف ترتيب الأسطر والهوامش. راجع الأصل عند الشك.",
                    "Extracted text only: images and scanned text may be absent, and line or footnote order may differ. Check the original when unsure.",
                  )}
            </p>
            {page.blocks.length ? (
              <div
                className="mx-auto max-w-[65ch]"
                style={{ fontSize: state.fontSize, lineHeight: 1.95, overflowWrap: "anywhere" }}
              >
                {page.blocks.map((block) => (
                  <p
                    id={block.id}
                    key={block.id}
                    data-reading-block
                    className="mb-6 whitespace-pre-wrap"
                    dir={block.direction}
                  >
                    {block.text}
                  </p>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-current/20 p-6">
                <h2 className="text-xl">
                  {L("لا يوجد نص قابل للاستخراج في هذه الصفحة", "No extractable text on this page")}
                </h2>
                <p className="mt-3 text-sm">
                  {L(
                    "قد تكون صورة ممسوحة. لم نحذف الصفحة أو نخمن محتواها. اقرأها في الملف الأصلي.",
                    "It may be a scanned image. This page was not removed and its text was not guessed. Read the original instead.",
                  )}
                </p>
                <button
                  type="button"
                  className={`${control} mt-4`}
                  onClick={() => setMode("original")}
                >
                  {L("عرض الصفحة الأصلية", "Show original page")}
                </button>
              </div>
            )}
          </>
        )}
      </article>
      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          className={control}
          disabled={page.number <= 1}
          onClick={() => go({ page: page.number - 1, block: null })}
        >
          {L("السابقة", "Previous")}
        </button>
        <span className="text-sm">
          {page.number} / {book.pageCount}
        </span>
        <button
          type="button"
          className={control}
          disabled={page.number >= book.pageCount}
          onClick={() => go({ page: page.number + 1, block: null })}
        >
          {L("التالية", "Next")}
        </button>
      </div>
    </section>
  );
}
