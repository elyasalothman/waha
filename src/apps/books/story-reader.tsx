import { useEffect, useState } from "react";
import type { CuratedBook } from "@/lib/books/curated";
import { loadStory } from "@/lib/books/stories";
import CuratedBookReader from "./curated-book-reader";

export default function StoryReader({ slug }: { slug: string }) {
  const [book, setBook] = useState<CuratedBook | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setBook(undefined);
    loadStory(slug).then(
      (b) => live && setBook(b),
      () => live && setBook(null),
    );
    return () => {
      live = false;
    };
  }, [slug]);
  if (book === undefined) return <p role="status">تحميل القصة…</p>;
  if (book === null) return <p role="alert">لم نجد هذه القصة.</p>;
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
