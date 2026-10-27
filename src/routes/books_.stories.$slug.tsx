import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { storyBySlug } from "@/lib/books/stories";
const StoryReader = lazy(() => import("@/apps/books/story-reader"));
export const Route = createFileRoute("/books_/stories/$slug")({
  component: StoryRoute,
  head: ({ params }) => {
    const story = storyBySlug(params.slug);
    return {
      meta: [
        { title: story ? `${story.title} · قصص غموض · واحة` : "قصص غموض · واحة" },
        { name: "description", content: story?.hook ?? "سلسلة قصص غموض من فريق الهجدة." },
      ],
    };
  },
});
function StoryRoute() {
  const { slug } = Route.useParams();
  return (
    <Suspense fallback={<p role="status">تحميل القصة…</p>}>
      <StoryReader slug={slug} />
    </Suspense>
  );
}
