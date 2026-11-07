import { createFileRoute } from "@tanstack/react-router";
import { parseAnalystFeed } from "@/lib/analysts-feed";

const FEED = "https://news.alhajda.com/api/analysts";
const ROSTER = "https://news.alhajda.com/api/analysts/roster";

export const Route = createFileRoute("/api/analysts")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const [feed, roster] = await Promise.all(
            [FEED, ROSTER].map(async (url) => {
              const response = await fetch(url, {
                signal: AbortSignal.timeout(12000),
                cache: "no-store",
                headers: { Accept: "application/json" },
              });
              if (!response.ok) throw new Error(String(response.status));
              return response.json();
            }),
          );
          return Response.json(
            {
              items: parseAnalystFeed(feed),
              roster: Array.isArray(roster?.roster) ? roster.roster : [],
              fetchedAt: new Date().toISOString(),
              source: FEED,
            },
            {
              headers: {
                "Cache-Control": "public, max-age=30, s-maxage=30",
                "X-Content-Type-Options": "nosniff",
              },
            },
          );
        } catch {
          return Response.json(
            { error: "تعذّر جلب المحللين", fetchedAt: null, items: [] },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
