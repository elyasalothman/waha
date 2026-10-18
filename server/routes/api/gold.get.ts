import { exchangeRates } from "../../lib/exchange";
export default async function goldFeed() {
  try {
    const [response, fx] = await Promise.all([
      fetch("https://api.gold-api.com/price/XAU", { signal: AbortSignal.timeout(8000) }),
      exchangeRates(),
    ]);
    if (!response.ok) throw new Error();
    const gold = await response.json();
    if (typeof gold.price !== "number" || !Number.isFinite(gold.price) || gold.price <= 0)
      throw new Error();
    return Response.json(
      {
        usdOz: gold.price,
        usdSar: 1 / fx.rates.USD,
        updatedAt: typeof gold.updatedAt === "string" ? gold.updatedAt : new Date().toISOString(),
        source: "Gold-API / ExchangeRate-API",
      },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } },
    );
  } catch {
    return Response.json(
      { error: "تعذّر تحديث سعر الذهب. أعد المحاولة." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
