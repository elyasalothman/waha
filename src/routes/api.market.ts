import { createFileRoute } from "@tanstack/react-router";

const TTL_MS = 60_000;
let cache: { at: number; body: unknown } | null = null;
let inFlight: Promise<Response> | null = null;

export const Route = createFileRoute("/api/market")({
  server: {
    handlers: {
      GET: async () => {
        try {
          if (cache && Date.now() - cache.at < TTL_MS) {
            return Response.json(cache.body, {
              headers: { "Cache-Control": "public, max-age=30", "X-Content-Type-Options": "nosniff" },
            });
          }
          inFlight ??= fetch("https://market.alhajda.com/api/pulse", {
            signal: AbortSignal.timeout(10000),
          })
          const response = await inFlight;
          inFlight = null;
          if (!response.ok) throw new Error("upstream");
          const data = await response.json();
          if (!Array.isArray(data.suggestions)) throw new Error("shape");
          const quotes = data.suggestions
            .filter(
              (q: { refPrice?: unknown; symbol?: unknown; asOf?: unknown }) =>
                typeof q.symbol === "string" &&
                typeof q.refPrice === "number" &&
                Number.isFinite(q.refPrice) &&
                typeof q.asOf === "string",
            )
            .slice(0, 10)
            .map(
              (q: {
                symbol: string;
                nameAr?: string;
                refPrice: number;
                currency?: string;
                asOf: string;
                changePct?: number;
                quoteSource?: string;
              }) => ({
                symbol: q.symbol,
                name: q.nameAr || q.symbol,
                price: q.refPrice,
                currency: q.currency || "",
                at: q.asOf,
                change:
                  typeof q.changePct === "number" && Number.isFinite(q.changePct)
                    ? q.changePct
                    : null,
                source: q.quoteSource || "",
              }),
            );
          const body = {
            generatedAt: typeof data.generated_at === "string" ? data.generated_at : null,
            fetchedAt: new Date().toISOString(),
            quotes,
          };
          cache = { at: Date.now(), body };
          return Response.json(body, {
            headers: { "Cache-Control": "public, max-age=30", "X-Content-Type-Options": "nosniff" },
          });
        } catch {
          inFlight = null;
          return Response.json(
            { error: "تعذّر تحميل موجز السوق" },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
