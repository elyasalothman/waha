import { createFileRoute } from "@tanstack/react-router";
import { parseAnalystFeed, recentAnalystOpinions } from "@/lib/analysts-feed";

const FEED = "https://news.alhajda.com/api/analysts";
const ROSTER = "https://news.alhajda.com/api/analysts/roster";
const TTL_MS = 60_000;
let cache: { at: number; body: unknown } | null = null;
let inFlight: Promise<unknown> | null = null;

export const Route = createFileRoute("/api/analysts")({
  server: {
    handlers: {
      GET: async () => {
        try {
          if (cache && Date.now() - cache.at < TTL_MS) {
            return Response.json(cache.body, {
              headers: {
                "Cache-Control": "public, max-age=30, s-maxage=30",
                "X-Content-Type-Options": "nosniff",
              },
            });
          }
          const pending = (inFlight ??= (async () => {
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
          const body = {
            items: recentAnalystOpinions(parseAnalystFeed(feed)),
            roster: Array.isArray(roster?.roster) ? roster.roster : [],
            fetchedAt: new Date().toISOString(),
            source: FEED,
          };
          cache = { at: Date.now(), body };
          return body;
          })());
          const body = await pending;
          inFlight = null;
          return Response.json(body, {
            headers: {
              "Cache-Control": "public, max-age=30, s-maxage=30",
              "X-Content-Type-Options": "nosniff",
            },
          });
        } catch {
          inFlight = null;
          return Response.json(
            { error: "تعذّر جلب المحللين", fetchedAt: null, items: [] },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
