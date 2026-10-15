import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AlhajdaReader = lazy(() => import("@/apps/books/alhajda-reader"));
export const Route = createFileRoute("/books_/alhajda")({
  component: BookRoute,
  head: () => ({
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
    <Suspense fallback={<p role="status">تحميل كتاب الهجدة…</p>}>
      <AlhajdaReader />
    </Suspense>
  );
}
