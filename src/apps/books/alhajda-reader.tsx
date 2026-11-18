import { useSettings } from "@/store/settings-store";
import { ReaderControls } from "./reader-controls";
import { Link } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { BookmarkPlus, Minus, Plus, List } from "lucide-react";
import {
  ALHAJDA_READING_KEY,
  LINE_HEIGHT,
  chapterForAnchor,
  curatedReading,
  searchCuratedBook,
  type CuratedBook,
  type CuratedFlow,
  type CuratedLineHeight,
  type CuratedPosition,
} from "@/lib/books/curated";
import edition from "@/lib/books/alhajda/edition.json";
import { pageForAnchor, readingMinutes, sectionIds } from "@/lib/books/alhajda/reading";
import { useAppStore } from "@/store/app-store";
import bookSource from "@/lib/books/alhajda/manifest.json";
import { firstVisibleReadingAnchor, useReaderLayout } from "./reader-layout";
import "./alhajda-reader.css";
import "./reader-layout.css";

// This is the reviewed, build-time book asset, never HTML extracted from user PDFs.
const book = bookSource as CuratedBook;

function withPreview(saved: ReturnType<typeof curatedReading>) {
  const params = new URLSearchParams(window.location.search);
  const theme = params.get("theme");
  const flow = params.get("flow");
  const leading = params.get("leading");
  const chapter = Number(params.get("chapter"));
  return curatedReading(
    {
      ...saved,
      ...(theme === "paper" || theme === "warm" || theme === "night" ? { theme } : {}),
      ...(flow === "scroll" || flow === "page" ? { flow } : {}),
      ...(leading === "compact" || leading === "comfortable" || leading === "relaxed"
        ? { lineHeight: leading }
        : {}),
      ...(params.get("focus") === "1" ? { focus: true } : {}),
      ...(Number.isInteger(chapter) && chapter >= 0 ? { chapter, anchor: null } : {}),
    },
    book,
  );
}

const control =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-current/25 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40";

export default function AlhajdaReader() {
  const ar = useAppStore((s) => s.lang) === "ar";
  const L = (a: string, e: string) => (ar ? a : e);
  const [state, setState] = useState(() => curatedReading(null, book));
  const [ready, setReady] = useState(false);
  const [warning, setWarning] = useState("");
  const [contents, setContents] = useState(false);
  const [marks, setMarks] = useState(false);
  const [query, setQuery] = useState("");
  const { reader, toolbar, getViewport, scrollTo, controlsVisible, toggleControls } =
    useReaderLayout();
  const article = useRef<HTMLElement>(null);
  const pending = useRef<CuratedPosition | null>(null);
  const latest = useRef(state);
  latest.current = state;
  const chapter = book.chapters[state.chapter];
  const [chapterHtml, setChapterHtml] = useState<Record<string, string>>({
    front: book.chapters[0].html,
  });
  const [loadError, setLoadError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [searchBook, setSearchBook] = useState<CuratedBook | null>(null);
  const [searchFailed, setSearchFailed] = useState(false);
  const html = chapterHtml[chapter.id];
  const wantsSearch = query.trim().length >= 2;
  useEffect(() => {
    if (html !== undefined) return;
    const controller = new AbortController();
    setLoadError(false);
    fetch(`/books/alhajda/chapters/${chapter.id}.json`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        if (data.id !== chapter.id || typeof data.html !== "string") throw new Error();
        setChapterHtml((old) => ({ ...old, [chapter.id]: data.html }));
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      });
    return () => controller.abort();
  }, [chapter.id, html, revision]);
  useEffect(() => {
    if (!wantsSearch || searchBook) return;
    const controller = new AbortController();
    setSearchFailed(false);
    fetch("/books/alhajda/chapters/search.json", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data.chapters) || data.chapters.length !== book.chapters.length)
          throw new Error();
        setSearchBook({
          ...book,
          chapters: book.chapters.map((c, i) => ({ ...c, ...data.chapters[i] })),
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setSearchFailed(true);
      });
    return () => controller.abort();
  }, [wantsSearch, searchBook, revision]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ALHAJDA_READING_KEY);
      const restored = curatedReading(
        saved
          ? JSON.parse(saved)
          : {
              theme:
                useSettings.getState().settings.readingNight ||
                document.documentElement.classList.contains("waha-dark")
                  ? "night"
                  : "paper",
            },
        book,
      );
      const preview = withPreview(restored);
      setState(preview);
      pending.current = preview;
    } catch {
      setWarning("تعذّر استعادة موضع القراءة. يمكنك متابعة القراءة من البداية.");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          ALHAJDA_READING_KEY,
          JSON.stringify({ ...state, savedAt: new Date().toISOString() }),
        );
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
        localStorage.setItem(
          ALHAJDA_READING_KEY,
          JSON.stringify({ ...latest.current, savedAt: new Date().toISOString() }),
        );
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
    if (!ready || !pending.current || !article.current || html === undefined) return;
    const position = pending.current;
    const frame = requestAnimationFrame(async () => {
      const anchor = position.anchor;
      await scrollTo(anchor ? document.getElementById(anchor) : article.current);
      if (pending.current === position) pending.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, state.chapter, state.fontSize, state.lineHeight, state.flow, scrollTo, html]);

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
        if (latest.current.flow === "page") return;
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
  }, [ready, state.chapter, getViewport, html]);

  function go(position: CuratedPosition) {
    pending.current = position;
    setState((current) => ({ ...current, ...position }));
    setContents(false);
    setQuery("");
    if (position.chapter === state.chapter)
      requestAnimationFrame(async () => {
        await scrollTo(
          position.anchor ? document.getElementById(position.anchor) : article.current,
        );
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
  function chooseFlow(flow: CuratedFlow) {
    const anchor = flow === "page" && html ? pageForAnchor(html, state.anchor) : state.anchor;
    pending.current = { ...state, anchor };
    setState((current) => ({ ...current, flow, anchor }));
  }
  const hits = useMemo(() => searchCuratedBook(searchBook || book, query), [query, searchBook]);
  const pages = useMemo(() => (html ? sectionIds(html) : []), [html]);
  const activePage = html && state.flow === "page" ? pageForAnchor(html, state.anchor) : null;
  const pageIndex = activePage ? Math.max(0, pages.indexOf(activePage)) : 0;
  const chapterMinutes = readingMinutes(chapter.words);
  const proseIds = new Set(["front", ...edition.chapters.map((row) => row.id)]);
  const bookMinutes = readingMinutes(
    book.chapters.reduce((sum, item) => sum + (proseIds.has(item.id) ? (item.words ?? 0) : 0), 0),
  );
  useLayoutEffect(() => {
    const root = article.current;
    if (!root) return;
    const sections = [...root.querySelectorAll<HTMLElement>("section.page")];
    for (const section of sections) {
      section.classList.toggle(
        "is-reading-page",
        state.flow === "page" && section.id === activePage,
      );
    }
  }, [state.flow, activePage, html, state.chapter]);
  const colors =
    state.theme === "night"
      ? { backgroundColor: "#28231e", color: "#f5ead6" }
      : state.theme === "warm"
        ? { backgroundColor: "#f4e4c4", color: "#3b2f1e" }
        : { backgroundColor: "#fffef9", color: "#242b28" };
  const themeStyle = {
    ...colors,
    "--alhajda-leading": String(LINE_HEIGHT[state.lineHeight]),
    "--alhajda-ink": colors.color,
    "--alhajda-paper": colors.backgroundColor,
  } as CSSProperties;
  return (
    <section
      ref={reader}
      className="curated-reader reader-layout mx-auto max-w-4xl rounded-2xl border border-current/10 p-4 sm:p-7"
      style={themeStyle}
      data-curated-book="alhajda"
      data-reader-theme={state.theme}
      data-flow={state.flow}
      data-focus={state.focus ? "on" : "off"}
      data-line-height={state.lineHeight}
    >
      <ReaderControls visible={controlsVisible} onToggle={toggleControls} />
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
      <p className="reader-secondary mt-3 text-xs leading-relaxed opacity-70">
        {L(
          "قراءة عربية مع الصور والمراجع. حجم الخط والمسافة والخلفية وطريقة العرض وموضع القراءة تُحفظ على هذا المتصفح فقط.",
          "Arabic text with its illustrations and references. Type size, spacing, theme, reading flow and position stay on this browser only.",
        )}
      </p>
      {bookMinutes !== null && (
        <p className="mt-2 text-sm" data-reading-time="book">
          {L(
            `نحو ${bookMinutes} دقيقة للكتاب كله${chapterMinutes !== null ? ` · ${chapterMinutes} لهذا القسم` : ""}`,
            `About ${bookMinutes} min for the book${chapterMinutes !== null ? ` · ${chapterMinutes} for this section` : ""}`,
          )}
          <span className="mt-1 block text-xs opacity-70">
            {L(
              "تقدير قراءة هادئة بنحو 180 كلمة في الدقيقة، لا قياسًا مضبوطًا.",
              "A calm-reading estimate of about 180 words a minute, not a measured rate.",
            )}
          </span>
        </p>
      )}
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
        <label className="sr-only" htmlFor="alhajda-leading">
          {L("مسافة الأسطر", "Line spacing")}
        </label>
        <select
          id="alhajda-leading"
          className={`${control} bg-transparent`}
          value={state.lineHeight}
          onChange={(event) => {
            pending.current = state;
            setState({
              ...state,
              lineHeight: event.target.value as CuratedLineHeight,
            });
          }}
        >
          <option value="compact">{L("أسطر قريبة", "Compact")}</option>
          <option value="comfortable">{L("أسطر مريحة", "Comfortable")}</option>
          <option value="relaxed">{L("أسطر واسعة", "Relaxed")}</option>
        </select>
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
          <option value="paper">{L("فاتح", "Light")}</option>
          <option value="warm">{L("سيبيا", "Sepia")}</option>
          <option value="night">{L("داكن", "Dark")}</option>
        </select>
        <label className="sr-only" htmlFor="alhajda-chapter">
          {L("الانتقال إلى فصل", "Jump to a chapter")}
        </label>
        <select
          id="alhajda-chapter"
          className={`${control} max-w-full bg-transparent`}
          value={state.chapter}
          onChange={(event) => go({ chapter: Number(event.target.value), anchor: null })}
        >
          {book.chapters.map((item, index) => (
            <option key={item.id} value={index}>
              {item.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={control}
          aria-pressed={state.flow === "page"}
          onClick={() => chooseFlow(state.flow === "page" ? "scroll" : "page")}
        >
          {state.flow === "page" ? L("صفحات", "Pages") : L("تمرير", "Scroll")}
        </button>
        <button
          type="button"
          className={control}
          aria-pressed={state.focus}
          onClick={() => setState((current) => ({ ...current, focus: !current.focus }))}
        >
          {L("تركيز", "Focus")}
        </button>
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
          <a href={book.pdfUrl} className={`${control} alhajda-pdf`} download="الهجدة.pdf">
            {L("تحميل PDF", "Download PDF")}
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
          {book.chapters.map((item, index) => {
            const guide = edition.chapters.find((row) => row.id === item.id);
            const minutes = readingMinutes(item.words);
            return (
              <button
                key={item.id}
                type="button"
                className="min-h-11 rounded-lg px-3 py-2 text-start hover:bg-current/5"
                aria-current={index === state.chapter ? "page" : undefined}
                onClick={() => go({ chapter: index, anchor: guide ? `alhajda-${item.id}-guide` : null })}
              >
                <span className="block">{item.title}</span>
                {guide && (
                  <span className="mt-1 block text-xs opacity-70" dir="rtl">
                    {guide.question}
                  </span>
                )}
                {minutes !== null && (
                  <span className="mt-1 block text-xs opacity-70">
                    {L(`نحو ${minutes} دقيقة`, `About ${minutes} min`)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}
      <div className="reader-secondary">
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
      </div>
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
      {state.flow === "page" && pages.length > 0 && (
        <nav
          className="mb-4 flex flex-wrap items-center justify-between gap-3"
          aria-label={L("صفحات هذا القسم", "Pages in this section")}
        >
          <button
            type="button"
            className={control}
            disabled={pageIndex <= 0}
            onClick={() => go({ chapter: state.chapter, anchor: pages[pageIndex - 1] ?? null })}
          >
            {L("الصفحة السابقة", "Previous page")}
          </button>
          <span className="text-sm tabular-nums">
            {pageIndex + 1} / {pages.length}
          </span>
          <button
            type="button"
            className={control}
            disabled={pageIndex >= pages.length - 1}
            onClick={() => go({ chapter: state.chapter, anchor: pages[pageIndex + 1] ?? null })}
          >
            {L("الصفحة التالية", "Next page")}
          </button>
        </nav>
      )}
      {loadError && (
        <p role="alert">
          تعذّر تحميل الفصل.{" "}
          <button className={control} onClick={() => setRevision((n) => n + 1)}>
            إعادة المحاولة
          </button>
        </p>
      )}
      {wantsSearch && !searchBook && (
        <p role="status">
          {searchFailed
            ? "تعذّر تحميل فهرس البحث. تحقق من الاتصال ثم أعد المحاولة."
            : "جارٍ تحميل فهرس البحث…"}
          {searchFailed && (
            <button className={control} onClick={() => setRevision((n) => n + 1)}>
              إعادة المحاولة
            </button>
          )}
        </p>
      )}
      {!ready || html === undefined ? (
        <p role="status" className="min-h-screen">
          {L("استعادة موضع القراءة…", "Restoring reading position…")}
        </p>
      ) : (
        <article
          ref={article}
          lang="ar"
          dir="rtl"
          className="alhajda-content reader-content"
          style={{ fontSize: `${state.fontSize}px`, lineHeight: LINE_HEIGHT[state.lineHeight] }}
          onClick={internalLink}
          dangerouslySetInnerHTML={{ __html: html }}
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
