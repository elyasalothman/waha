import { useEffect, useState } from "react";
import type { CuratedBook } from "@/lib/books/curated";
import { ReadingStatus } from "@/components/reading-status";
import CuratedBookReader from "./curated-book-reader";
import "./trading-guide-reader.css";

export default function TradingGuideReader() {
  const [book, setBook] = useState<CuratedBook | null>(null);
  const [phase, setPhase] = useState<"loading" | "error">("loading");
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setBook(null);
    setPhase("loading");
    setSlow(false);
    const timer = window.setTimeout(() => {
      if (live) setSlow(true);
    }, 8000);
    import("@/lib/books/trading-guide/book.json")
      .then((mod) => {
        if (live) setBook(mod.default as CuratedBook);
      })
      .catch(() => {
        if (live) setPhase("error");
      });
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [attempt]);
  if (!book) {
    return (
      <ReadingStatus
        title="دليل التداول"
        state={phase}
        detail={
          slow && phase === "loading"
            ? "ملف الدليل كبير. إن بقي التحميل، أعد المحاولة."
            : undefined
        }
        onRetry={phase === "error" || (slow && phase === "loading") ? () => setAttempt((n) => n + 1) : undefined}
      />
    );
  }
  return (
    <CuratedBookReader
      book={book}
      storageKey="waha:curated:trading-guide:20261007"
      bookId="trading-guide"
      notice="مادة تعليمية مؤرخة 7 أكتوبر 2026، وليست توصية استثمارية. قد تتغير القواعد والرسوم؛ راجع المصدر الرسمي قبل اتخاذ قرار."
    />
  );
}
