import { useSettings } from "@/store/settings-store";
import { useReaderLayout } from "../reader-layout";
import { ReaderControls } from "../reader-controls";
import "../reader-layout.css";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import midad from "@/lib/books/platform/midad.json";
import { getDraft } from "@/lib/books/platform/local";
import { validateBook, type ReadingBook } from "@/lib/books/platform/model";
const control = "min-h-11 min-w-11 rounded-lg border border-current/20 px-3 text-sm";
type Position = { chapter: number; paragraph: number; size: number; night: boolean };
const defaults: Position = { chapter: 0, paragraph: 0, size: 22, night: false };
export function PlatformReader({ id }: { id: string }) {
  const [book, setBook] = useState<ReadingBook>();
  const [error, setError] = useState("");
  const [position, setPosition] = useState<Position>(defaults);
  const [revision, setRevision] = useState(0);
  const article = useRef<HTMLElement>(null);
  const { reader, toolbar, controlsVisible, toggleControls } = useReaderLayout(Boolean(book));
  const pendingRestore = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    setBook(undefined);
    setError("");
    let next = { ...defaults, night: useSettings.getState().settings.readingNight };
    try {
      const p = JSON.parse(localStorage.getItem(`waha:reading:${id}`) || "null");
      if (p && Number.isInteger(p.chapter) && Number.isInteger(p.paragraph))
        next = {
          chapter: Math.max(0, p.chapter),
          paragraph: Math.max(0, p.paragraph),
          size: Math.max(16, Math.min(34, Number(p.size) || 22)),
          night: p.night === true,
        };
    } catch {
      /* optional storage */
    }
    void (async () => {
      let result: unknown;
      if (id.startsWith("draft-")) result = await getDraft(id);
      else {
        const imported = midad.some((b) => b.id === id);
        const response = await fetch(
          imported ? `/books/midad/${id}.json` : `/api/books?id=${encodeURIComponent(id)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("الكتاب غير موجود أو تعذّر تحميله. حاول مجددًا.");
        const data = await response.json();
        result = imported ? data : data?.id ? data : undefined;
      }
      if (!result) throw new Error("المسودة غير موجودة على هذا الجهاز.");
      const validated = validateBook(result);
      next.chapter = Math.min(next.chapter, validated.chapters.length - 1);
      next.paragraph = Math.min(
        next.paragraph,
        validated.chapters[next.chapter].paragraphs.length - 1,
      );
      if (!controller.signal.aborted) {
        pendingRestore.current = next.paragraph;
        setPosition(next);
        setBook(validated);
      }
    })().catch((e) => {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : "تعذّر فتح الكتاب.");
    });
    return () => controller.abort();
  }, [id, revision]);
  useEffect(() => {
    if (!book) return;
    // Fonts may reflow paragraphs. Restore after fonts are ready, then observe reading.
    let disposed = false;
    let observer: IntersectionObserver | undefined;
    let frame = 0;
    void document.fonts.ready.then(() => {
      if (disposed) return;
      frame = requestAnimationFrame(() => {
        const p = pendingRestore.current;
        if (p > 0)
          article.current
            ?.querySelector(`[data-paragraph="${p}"]`)
            ?.scrollIntoView({ block: "start" });
        observer = new IntersectionObserver(
          (entries) => {
            const visible = entries
              .filter((e) => e.isIntersecting)
              .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
            if (visible) {
              const paragraph = Number((visible.target as HTMLElement).dataset.paragraph);
              setPosition((current) =>
                current.paragraph === paragraph ? current : { ...current, paragraph },
              );
            }
          },
          { rootMargin: "-15% 0px -55% 0px", threshold: 0 },
        );
        article.current?.querySelectorAll("[data-paragraph]").forEach((p) => observer?.observe(p));
      });
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [book, position.chapter]);
  useEffect(() => {
    if (!book) return;
    try {
      localStorage.setItem(`waha:reading:${id}`, JSON.stringify(position));
    } catch {
      /* reader remains usable */
    }
  }, [book, id, position]);
  function changeChapter(chapter: number) {
    pendingRestore.current = 0;
    setPosition((p) => ({ ...p, chapter, paragraph: 0 }));
    article.current?.scrollIntoView({ block: "start" });
  }
  if (error)
    return (
      <div role="alert" className="mx-auto max-w-xl">
        <p>{error}</p>
        <button className={`${control} mt-4`} onClick={() => setRevision((v) => v + 1)}>
          إعادة المحاولة
        </button>
        <Link to="/books" className="ms-3 inline-flex min-h-11 items-center">
          المكتبة
        </Link>
      </div>
    );
  if (!book) return <p role="status">جارٍ تحميل الكتاب…</p>;
  const current = book.chapters[position.chapter];
  return (
    <section
      ref={reader}
      dir="rtl"
      data-platform-reader={id}
      data-reader-theme={position.night ? "night" : "paper"}
      className={`reader-layout mx-auto min-w-0 max-w-2xl rounded-xl p-4 sm:p-6 [overflow-wrap:anywhere] ${position.night ? "bg-[#28231e] text-[#f5ead6]" : "bg-[#fbf6e9] text-[#243e32]"}`}
    >
      <ReaderControls visible={controlsVisible} onToggle={toggleControls} />
      <Link to="/books" className="inline-flex min-h-11 items-center underline">
        العودة إلى المكتبة
      </Link>
      <header className="mt-4">
        <h1 className="font-display text-3xl">{book.title}</h1>
        <p className="mt-2 text-sm opacity-75">
          {book.author} · {book.category} · {book.audience}
        </p>
      </header>
      <div
        ref={toolbar}
        className="reader-toolbar mt-5 flex flex-wrap items-center gap-2"
        aria-label="إعدادات القراءة"
      >
        <button
          className={control}
          aria-label="تصغير الخط"
          disabled={position.size <= 16}
          onClick={() => setPosition((p) => ({ ...p, size: Math.max(16, p.size - 2) }))}
        >
          أ−
        </button>
        <output className="px-2 text-sm" aria-label="حجم الخط">
          {position.size}
        </output>
        <button
          className={control}
          aria-label="تكبير الخط"
          disabled={position.size >= 34}
          onClick={() => setPosition((p) => ({ ...p, size: Math.min(34, p.size + 2) }))}
        >
          أ+
        </button>
        <button
          className={control}
          aria-pressed={position.night}
          onClick={() => setPosition((p) => ({ ...p, night: !p.night }))}
        >
          وضع ليلي
        </button>
      </div>
      <label className="reader-secondary-controls mt-4 block text-sm">
        الفهرس
        <select
          className={`${control} mt-2 w-full bg-transparent`}
          value={position.chapter}
          onChange={(e) => changeChapter(Number(e.target.value))}
        >
          {book.chapters.map((c, i) => (
            <option className="bg-[#fbf6e9] text-[#243e32]" key={i} value={i}>
              {i + 1}. {c.title}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-3 text-xs opacity-75">
        الفصل {position.chapter + 1} من {book.chapters.length} · يُحفظ موضع القراءة على جهازك
        تلقائيًا
      </p>
      <article
        ref={article}
        className="mt-8 scroll-mt-24 leading-[2]"
        style={{ fontSize: `${position.size}px` }}
      >
        <h2 className="mb-5 font-display text-[1.2em]">{current.title}</h2>
        {current.paragraphs.map((p, i) => (
          <p key={i} data-paragraph={i} className="mb-5 scroll-mt-24 whitespace-pre-wrap">
            {p}
          </p>
        ))}
      </article>
      <nav className="mt-6 flex flex-wrap justify-between gap-3" aria-label="التنقل بين الفصول">
        <button
          className={control}
          disabled={position.chapter === 0}
          onClick={() => changeChapter(position.chapter - 1)}
        >
          الفصل السابق
        </button>
        <button
          className={control}
          disabled={position.chapter === book.chapters.length - 1}
          onClick={() => changeChapter(position.chapter + 1)}
        >
          الفصل التالي
        </button>
      </nav>
    </section>
  );
}
