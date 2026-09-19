import { createFileRoute } from "@tanstack/react-router";
import { BooksPage } from "@/apps/books/page";

export const Route = createFileRoute("/books")({
  component: BooksRoute,
});

function BooksRoute() {
  return <BooksPage />;
}
