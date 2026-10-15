import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { BookmarkPlus, Minus, Plus, List } from "lucide-react";
import {
  ALHAJDA_READING_KEY,
  chapterForAnchor,
  curatedReading,
  searchCuratedBook,
  type CuratedBook,
  type CuratedPosition,
} from "@/lib/books/curated";
import { useAppStore } from "@/store/app-store";
import bookSource from "@/lib/books/alhajda/book.json";
import { firstVisibleReadingAnchor, useReaderLayout } from "./reader-layout";
import "./alhajda-reader.css";
import "./reader-layout.css";

// This is the reviewed, build-time book asset, never HTML extracted from user PDFs.
const book = bookSource as CuratedBook;
const control =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-current/25 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40";

export default function AlhajdaReader() {
  const ar = useAppStore((s) => s.lang) === "ar";
  const L = (a: string, e: string) => (ar ? a : e);
  const [state, setState] = useState(() => curatedReading(null, book));
  const [ready, setReady] = useState(false);
  const [warning, setWarning] = useState("");
  const [contents, setContents] = useState(false);
  const [marks, setMarks] = useState(false);
  const [query, setQuery] = useState("");
  const { reader, toolbar, getViewport, scrollTo } = useReaderLayout();
  const article = useRef<HTMLElement>(null);
  const pending = useRef<CuratedPosition | null>(null);
  const latest = useRef(state);
  latest.current = state;
  const chapter = book.chapters[state.chapter];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ALHAJDA_READING_KEY);
      const restored = curatedReading(saved ? JSON.parse(saved) : null, book);
      setState(restored);
      pending.current = restored;
    } catch {
      setWarning("تعذّر استعادة موضع القراءة. يمكنك متابعة القراءة من البداية.");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(ALHAJDA_READING_KEY, JSON.stringify(state));
        setWarning("");
      } catch {
        setWarning(
          "تعذّر حفظ موضع القراءة على هذا المتصفح. أبقِ هذه الصفحة مفتوحة أو احفظ رقم الفصل.",
        );
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [ready, state]);

  useEffect(() => {
    if (!ready) return;
    const save = () => {
      try {
        localStorage.setItem(ALHAJDA_READING_KEY, JSON.stringify(latest.current));
      } catch {
        /* visible save effect reports failures */
      }
    };
    document.addEventListener("visibilitychange", save);
    return () => {
      document.removeEventListener("visibilitychange", save);
      save();
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || !pending.current || !article.current) return;
    const position = pending.current;
    const frame = requestAnimationFrame(async () => {
      const anchor = position.anchor;
      await scrollTo(anchor ? document.getElementById(anchor) : article.current);
      if (pending.current === position) pending.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, state.chapter, state.fontSize, scrollTo]);

  useEffect(() => {
    if (!ready || !article.current) return;
    const root = article.current;
    let frame = 0;
    const observe = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (pending.current) return;
        const nodes = root.querySelectorAll<HTMLElement>("[data-reader-anchor], p[id], h2[id]");
        const { top, bottom } = getViewport();
        const visible = firstVisibleReadingAnchor(nodes, top, bottom);
        if (visible)
          setState((current) =>
            current.anchor === visible.id ? current : { ...current, anchor: visible.id },
          );
      });
    };
    window.addEventListener("scroll", observe, { passive: true });
    return () => {
      window.removeEventListener("scroll", observe);
      cancelAnimationFrame(frame);
    };
  }, [ready, state.chapter, getViewport]);

  function go(position: CuratedPosition) {
    pending.current = position;
    setState((current) => ({ ...current, ...position }));
    setContents(false);
    setQuery("");
    if (position.chapter === state.chapter)
      requestAnimationFrame(async () => {
        await scrollTo(position.anchor ? document.getElementById(position.anchor) : article.current);
        if (pending.current === position) pending.current = null;
      });
  }
  function internalLink(event: MouseEvent<HTMLElement>) {
    const target = event.target instanceof Element ? event.target.closest("a") : null;
    const href = target?.getAttribute("href");
    if (!href?.startsWith("#")) return;
    let anchor: string;
    try {
      anchor = decodeURIComponent(href.slice(1));
    } catch {
      return;
    }
    const destination = chapterForAnchor(book, anchor);
    if (destination === null) return;
    event.preventDefault();
    go({ chapter: destination, anchor });
  }
  function resize(delta: number) {
    pending.current = state;
    setState((current) => ({
      ...current,
      fontSize: Math.min(40, Math.max(18, current.fontSize + delta)),
    }));
  }
  const hits = useMemo(() => searchCuratedBook(book, query), [query]);
  const colors =
    state.theme === "night"
      ? { backgroundColor: "#1b2427", color: "#eeeae0" }
      : state.theme === "warm"
        ? { backgroundColor: "#f7edda", color: "#30271f" }
        : { backgroundColor: "#fffef9", color: "#242b28" };
  return (
    <section
      ref={reader}
      className="curated-reader reader-layout mx-auto max-w-4xl rounded-2xl border border-current/10 p-4 sm:p-7"
      style={colors}
      data-curated-book="alhajda"
      data-reader-theme={state.theme}
    >
      <Link to="/books" className="inline-flex min-h-11 items-center text-sm underline">
        {L("العودة إلى المكتبة", "Back to library")}
      </Link>
      <p className="mt-4 text-xs opacity-70">
        {book.edition} · {L("الطبعة الأولى", "First edition")}
      </p>
      <h1 className="mt-2 font-display text-4xl" dir="rtl">
        {book.title}
      </h1>
      <p className="mt-3 text-lg" dir="rtl">
        {book.subtitle}
      </p>
      <p className="mt-3 text-xs leading-relaxed opacity-70">
        {L(
          "قراءة عربية متصلة مع الصور والمراجع وحقوقها. حجم الخط وموضع القراءة محفوظان على هذا المتصفح فقط.",
          "Read the Arabic text with its illustrations, references and credits. Text size and reading position are saved only in this browser.",
        )}
      </p>
      <button
        type="button"
        className={`${control} mt-5`}
        aria-expanded={contents}
        onClick={() => setContents(!contents)}
      >
        <List className="size-4" />
        {L("فهرس الكتاب", "Contents")}
      </button>
      <div
        ref={toolbar}
        className="reader-toolbar mt-3 flex flex-wrap gap-2"
        aria-label={L("إعدادات القراءة", "Reading settings")}
      >
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
        <label className="sr-only" htmlFor="alhajda-theme">
          {L("خلفية القراءة", "Reading theme")}
        </label>
        <select
          id="alhajda-theme"
          className={`${control} bg-transparent`}
          value={state.theme}
          onChange={(event) =>
            setState({ ...state, theme: event.target.value as typeof state.theme })
          }
        >
          <option value="paper">{L("ورق", "Paper")}</option>
          <option value="warm">{L("دافئ", "Warm")}</option>
          <option value="night">{L("ليل", "Night")}</option>
        </select>
        <button
          type="button"
          className={control}
          onClick={() => {
            setState((current) =>
              curatedReading(
                {
                  ...current,
                  bookmarks: [
                    ...current.bookmarks,
                    { chapter: current.chapter, anchor: current.anchor },
                  ],
                },
                book,
              ),
            );
            setMarks(true);
          }}
        >
          <BookmarkPlus className="size-4" />
          {L("حفظ موضع", "Bookmark")}
        </button>
        {book.pdfUrl && (
          <a href={book.pdfUrl} className={control} download>
            {L("تنزيل PDF", "Download PDF")}
          </a>
        )}
      </div>
      {warning && (
        <p role="alert" className="mt-3 rounded-lg border border-current/20 p-3 text-sm">
          {warning}
        </p>
      )}
      {contents && (
        <nav
          aria-label={L("فهرس الكتاب", "Book contents")}
          className="mt-4 grid gap-2 rounded-xl border border-current/20 p-3"
        >
          {book.chapters.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className="min-h-11 rounded-lg px-3 py-2 text-start hover:bg-current/5"
              aria-current={index === state.chapter ? "page" : undefined}
              onClick={() => go({ chapter: index, anchor: null })}
            >
              {item.title}
            </button>
          ))}
        </nav>
      )}
      <label htmlFor="alhajda-search" className="mt-5 block text-sm">
        {L("بحث في الكتاب", "Search the book")}
      </label>
      <input
        id="alhajda-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-lg border border-current/20 bg-transparent px-3 text-base"
        placeholder={L("كلمة أو فكرة…", "A word or idea…")}
      />
      {query.trim().length >= 2 && (
        <div
          className="mt-2 max-h-72 overflow-auto rounded-lg border border-current/20 p-3"
          aria-label={L("نتائج البحث", "Search results")}
        >
          <p className="text-xs">
            {L(`${hits.length} نتيجة، حتى ١٠٠`, `${hits.length} results, up to 100`)}
          </p>
          {hits.map((hit, index) => (
            <button
              key={`${hit.anchor}-${index}`}
              type="button"
              className="block min-h-11 w-full border-b border-current/10 py-3 text-start"
              onClick={() => go(hit)}
            >
              <span className="text-xs opacity-70">{book.chapters[hit.chapter].title}</span>
              <span className="mt-1 block line-clamp-2" dir="rtl">
                {hit.text}
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className={`${control} mt-3`}
        aria-expanded={marks}
        onClick={() => setMarks(!marks)}
      >
        {L(`المواضع المحفوظة (${state.bookmarks.length})`, `Bookmarks (${state.bookmarks.length})`)}
      </button>
      {marks && (
        <ul className="mt-2 grid gap-2">
          {state.bookmarks.map((mark, index) => (
            <li key={`${mark.chapter}-${mark.anchor}`} className="flex flex-wrap gap-2">
              <button type="button" className={control} onClick={() => go(mark)}>
                {book.chapters[mark.chapter].title} · {index + 1}
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
        aria-label={L("أقسام الكتاب", "Book sections")}
      >
        <button
          type="button"
          className={control}
          disabled={state.chapter <= 0}
          onClick={() => go({ chapter: state.chapter - 1, anchor: null })}
        >
          {L("القسم السابق", "Previous section")}
        </button>
        <span className="max-w-[50%] text-center text-sm">{chapter.title}</span>
        <button
          type="button"
          className={control}
          disabled={state.chapter >= book.chapters.length - 1}
          onClick={() => go({ chapter: state.chapter + 1, anchor: null })}
        >
          {L("القسم التالي", "Next section")}
        </button>
      </nav>
      {!ready ? (
        <p role="status">{L("استعادة موضع القراءة…", "Restoring reading position…")}</p>
      ) : (
        <article
          ref={article}
          lang="ar"
          dir="rtl"
          className="alhajda-content reader-content"
          style={{ fontSize: `${state.fontSize}px` }}
          onClick={internalLink}
          dangerouslySetInnerHTML={{ __html: chapter.html }}
        />
      )}
      <nav
        className="mt-8 flex flex-wrap justify-between gap-3"
        aria-label={L("متابعة القراءة", "Continue reading")}
      >
        <button
          type="button"
          className={control}
          disabled={state.chapter <= 0}
          onClick={() => go({ chapter: state.chapter - 1, anchor: null })}
        >
          {L("السابق", "Previous")}
        </button>
        <button
          type="button"
          className={control}
          disabled={state.chapter >= book.chapters.length - 1}
          onClick={() => go({ chapter: state.chapter + 1, anchor: null })}
        >
          {L("التالي", "Next")}
        </button>
      </nav>
    </section>
  );
}
