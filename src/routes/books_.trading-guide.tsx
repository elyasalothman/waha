import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const TradingGuideReader = lazy(() => import("@/apps/books/trading-guide-reader"));
export const Route = createFileRoute("/books_/trading-guide")({
  component: BookRoute,
  head: () => ({
    meta: [
      { title: "دليل المضاربة والتداول في الأسهم الأمريكية · واحة" },
      {
        name: "description",
        content:
          "17 فصلًا تعليميًا عن السوق الأمريكي، مع الجداول والمراجع وفهرس وبحث وخط قابل للتكبير.",
      },
    ],
  }),
});
function BookRoute() {
  return (
    <Suspense fallback={<p role="status">تحميل دليل التداول…</p>}>
      <TradingGuideReader />
    </Suspense>
  );
}
