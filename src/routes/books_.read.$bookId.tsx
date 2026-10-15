import { createFileRoute } from "@tanstack/react-router";
import { PrivateReader } from "@/apps/books/private-reader";

export const Route = createFileRoute("/books_/read/$bookId")({ component: ReaderRoute });
function ReaderRoute() {
  return <PrivateReader bookId={Route.useParams().bookId} />;
}
