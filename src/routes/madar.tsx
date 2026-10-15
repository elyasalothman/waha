import { createFileRoute } from "@tanstack/react-router";
import { MadarPortal } from "@/apps/madar/portal";

type MadarSearch = { q?: string };

export const Route = createFileRoute("/madar")({
  head: () => ({
    meta: [
      { title: "مدار · واحة" },
      { name: "description", content: "ابحث واستكشف عبر بوابة مدار في واحة." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): MadarSearch => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: MadarPage,
});

function MadarPage() {
  const { q } = Route.useSearch();
  return <MadarPortal initialQuery={q ?? ""} />;
}
