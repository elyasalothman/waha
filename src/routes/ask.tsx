import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/ask")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q.slice(0, 8000) : "",
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/mohsen",
      search: { q: search.q, mode: "chat", attach: false },
      replace: true,
    });
  },
});
