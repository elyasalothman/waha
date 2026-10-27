import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/analysts")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const [feed, roster] = await Promise.all(
            [
              "https://news.alhajda.com/api/analysts",
              "https://news.alhajda.com/api/analysts/roster",
            ].map(async (url) => {
              const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
              if (!r.ok) throw new Error();
              return r.json();
            }),
          );
          return Response.json(
            { items: feed.items || [], roster: roster.roster || [] },
            { headers: { "Cache-Control": "public, max-age=120" } },
          );
        } catch {
          return Response.json(
            { error: "تعذّر جلب المحللين" },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
