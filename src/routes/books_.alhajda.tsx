import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AlhajdaReader = lazy(() => import("@/apps/books/alhajda-reader"));
export const Route = createFileRoute("/books_/alhajda")({
  component: BookRoute,
  head: () => ({
    links: [
      {
        rel: "preload",
        as: "image",
        href: "/books/alhajda/assets/front-earth.webp",
        fetchPriority: "high",
      },
      {
        rel: "preload",
        href: "/books/alhajda/assets/fonts/NotoNaskhArabic-Regular.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
    ],
    meta: [
      { title: "كتاب الهجدة · قراءة داخل واحة" },
      {
        name: "description",
        content:
          "الهجدة: أسئلة تغيّر ما نراه. ستة فصول مع المراجع وحقوق الصور، بخط قابل للتكبير وقراءة مناسبة للجوال.",
      },
    ],
  }),
});
function BookRoute() {
  return (
    <Suspense
      fallback={
        <div className="reader-layout min-h-screen" role="status">
          تحميل كتاب الهجدة…
        </div>
      }
    >
      <AlhajdaReader />
    </Suspense>
  );
}
