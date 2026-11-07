import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ReadingStatus } from "@/components/reading-status";
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
    <Suspense fallback={<ReadingStatus title="دليل التداول" state="loading" />}>
      <TradingGuideReader />
    </Suspense>
  );
}
