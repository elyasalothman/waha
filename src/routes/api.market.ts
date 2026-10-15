import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/market")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const response = await fetch("https://market.alhajda.com/api/pulse", {
            signal: AbortSignal.timeout(10000),
          });
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
          return Response.json(
            { generatedAt: data.generated_at, quotes },
            { headers: { "Cache-Control": "public, max-age=60" } },
          );
        } catch {
          return Response.json(
            { error: "تعذّر تحميل موجز السوق" },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
