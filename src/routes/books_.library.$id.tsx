import { createFileRoute } from "@tanstack/react-router";
import { PlatformReader } from "@/apps/books/platform/reader";
export const Route = createFileRoute("/books_/library/$id")({
  head: () => ({
    meta: [
      { title: "بيت القراءة · واحة" },
      { name: "description", content: "قراءة عربية مرنة للجوال مع فهرس ووضع ليلي وحفظ الموضع." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Reader,
});
function Reader() {
  return <PlatformReader key={Route.useParams().id} id={Route.useParams().id} />;
}
