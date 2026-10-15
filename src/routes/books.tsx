import { createFileRoute } from "@tanstack/react-router";
import { BooksPage } from "@/apps/books/page";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "رف الكتب · واحة" },
      {
        name: "description",
        content: "اقرأ كتاب الهجدة وتصفح الكتب وأضف كتبك إلى رف محلي خاص على جهازك.",
      },
    ],
  }),
  component: BooksRoute,
});

function BooksRoute() {
  return <BooksPage />;
}
