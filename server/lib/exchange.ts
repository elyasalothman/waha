type ExchangeSnapshot = {
  rates: Record<string, number>;
  updatedAt: string;
  source: string;
  at: number;
};
let cache: ExchangeSnapshot | null = null;
let inFlight: Promise<ExchangeSnapshot> | null = null;
export async function exchangeRates(): Promise<ExchangeSnapshot> {
  if (cache && Date.now() - cache.at < 3600000) return cache;
  inFlight ??= (async () => {
    const response = await fetch("https://open.er-api.com/v6/latest/SAR", {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("rates unavailable");
    const data = await response.json();
    if (
      data.result !== "success" ||
      data.base_code !== "SAR" ||
      !data.rates ||
      typeof data.time_last_update_unix !== "number"
    )
      throw new Error("invalid rates");
    const age = Date.now() - data.time_last_update_unix * 1000;
    if (age > 72 * 3600000 || age < -300000) throw new Error("stale rates");
    const rates: Record<string, number> = {};
    for (const [code, rate] of Object.entries(data.rates))
      if (/^[A-Z]{3}$/.test(code) && typeof rate === "number" && Number.isFinite(rate) && rate > 0)
        rates[code] = rate;
    if (rates.SAR !== 1 || !rates.USD) throw new Error("invalid base");
    cache = {
      rates,
      updatedAt: new Date(data.time_last_update_unix * 1000).toISOString(),
      source: "ExchangeRate-API",
      at: Date.now(),
    };
    return cache;
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
