import { createFileRoute } from "@tanstack/react-router";
import { PrivateReader } from "@/apps/books/private-reader";

export const Route = createFileRoute("/books_/read/$bookId")({
  head: () => ({
    meta: [
      { title: "قارئ كتبي · واحة" },
      { name: "description", content: "اقرأ كتابك الخاص المحفوظ على هذا الجهاز داخل واحة." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ReaderRoute,
});
function ReaderRoute() {
  return <PrivateReader bookId={Route.useParams().bookId} />;
}
