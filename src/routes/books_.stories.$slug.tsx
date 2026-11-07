import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { storyBySlug } from "@/lib/books/stories";
import { ReadingStatus } from "@/components/reading-status";
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
    <Suspense fallback={<ReadingStatus title="قصة" state="loading" />}>
      <StoryReader slug={slug} />
    </Suspense>
  );
}
