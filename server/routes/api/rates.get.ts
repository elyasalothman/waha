import { exchangeRates } from "../../lib/exchange";
export default async function ratesFeed() {
  try {
    const { rates, updatedAt, source } = await exchangeRates();
    return Response.json(
      { base: "SAR", rates, updatedAt, source },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } },
    );
  } catch {
    return Response.json(
      { error: "تعذّر تحديث أسعار العملات. أعد المحاولة." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
