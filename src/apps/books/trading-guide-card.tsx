import { Link } from "@tanstack/react-router";
import { useAppStore } from "@/store/app-store";
export function TradingGuideCard() {
  const ar = useAppStore((s) => s.lang) === "ar";
  return (
    <section
      className="mb-8 rounded-2xl border border-primary/25 bg-surface p-5 sm:p-6"
      data-curated-book-card="trading-guide"
    >
      <p className="text-xs text-primary">
        {ar ? "مرجع تعليمي · 7 أكتوبر 2026" : "Educational reference · 7 October 2026"}
      </p>
      <h2 className="mt-2 font-display text-3xl">
        {ar ? "دليل المضاربة والتداول في الأسهم الأمريكية" : "US Trading Guide"}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {ar
          ? "17 فصلًا عربيًا مع الجداول والمراجع. فهرس وبحث وخط قابل للتكبير وحفظ موضع القراءة. محتوى تعليمي وليس توصية استثمارية."
          : "17 Arabic chapters with tables and references. Search, contents, adjustable text and saved reading position. Educational content, not investment advice."}
      </p>
      <Link
        to="/books/trading-guide"
        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 py-2 text-sm text-primary-fg"
      >
        {ar ? "اقرأ الدليل" : "Read the guide"}
      </Link>
    </section>
  );
}
