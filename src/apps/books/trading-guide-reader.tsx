import type { CuratedBook } from "@/lib/books/curated";
import bookSource from "@/lib/books/trading-guide/book.json";
import CuratedBookReader from "./curated-book-reader";
import "./trading-guide-reader.css";

export default function TradingGuideReader() {
  return (
    <CuratedBookReader
      book={bookSource as CuratedBook}
      storageKey="waha:curated:trading-guide:20261007"
      bookId="trading-guide"
      notice="مادة تعليمية مؤرخة 7 أكتوبر 2026، وليست توصية استثمارية. قد تتغير القواعد والرسوم؛ راجع المصدر الرسمي قبل اتخاذ قرار."
    />
  );
}
