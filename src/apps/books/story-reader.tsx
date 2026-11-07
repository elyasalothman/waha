import { useEffect, useState } from "react";
import type { CuratedBook } from "@/lib/books/curated";
import { loadStory, storyBySlug } from "@/lib/books/stories";
import { ReadingStatus } from "@/components/reading-status";
import CuratedBookReader from "./curated-book-reader";

export default function StoryReader({ slug }: { slug: string }) {
  const known = storyBySlug(slug);
  const [book, setBook] = useState<CuratedBook | null>(null);
  const [phase, setPhase] = useState<"loading" | "missing" | "error">(known ? "loading" : "missing");
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!known) return;
    let live = true;
    setBook(null);
    setPhase("loading");
    setSlow(false);
    const timer = window.setTimeout(() => {
      if (live) setSlow(true);
    }, 8000);
    loadStory(slug).then(
      (value) => {
        if (!live) return;
        if (!value) setPhase("missing");
        else setBook(value);
      },
      () => {
        if (live) setPhase("error");
      },
    );
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [slug, attempt, known]);
  if (!book) {
    return (
      <ReadingStatus
        title={known?.title || "قصة"}
        state={phase}
        detail={
          slow && phase === "loading"
            ? "ما زال الفتح يأخذ وقتًا أطول من المعتاد. يمكنك إعادة المحاولة."
            : undefined
        }
        onRetry={phase === "error" || (slow && phase === "loading") ? () => setAttempt((n) => n + 1) : undefined}
      />
    );
  }
  return (
    <CuratedBookReader
      key={slug}
      book={book}
      storageKey={`waha:curated:story:${slug}`}
      bookId={`story-${slug}`}
      intro="حجم الخط وموضع القراءة محفوظان على هذا المتصفح فقط."
      notice="من سلسلة «قصص غموض» · فريق الهجدة، بمساعدة الذكاء الاصطناعي. قصة خيالية؛ الأسماء والأحداث من الخيال."
    />
  );
}
