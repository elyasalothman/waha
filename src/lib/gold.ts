const OZ_GRAMS = 31.1034768;
const FALLBACK_USD_OZ = 2650;
const FALLBACK_USD_SAR = 3.75;

export type GoldQuote = {
  usdOz: number;
  usdSar: number;
  sarG24: number;
  sarG21: number;
  sarG18: number;
  approx: boolean;
};

function pack(usdOz: number, usdSar: number, approx: boolean): GoldQuote {
  const sarG24 = (usdOz / OZ_GRAMS) * usdSar;
  return {
    usdOz,
    usdSar,
    sarG24,
    sarG21: sarG24 * (21 / 24),
    sarG18: sarG24 * (18 / 24),
    approx,
  };
}

export async function fetchGold(): Promise<GoldQuote> {
  try {
    const [goldRes, fxRes] = await Promise.all([
      fetch("https://api.gold-api.com/price/XAU"),
      fetch("https://api.frankfurter.app/latest?from=USD&to=SAR"),
    ]);
    let usdOz = FALLBACK_USD_OZ;
    let usdSar = FALLBACK_USD_SAR;
    let approx = false;
    if (goldRes.ok) {
      const g = (await goldRes.json()) as { price?: number };
      if (typeof g.price === "number" && g.price > 0) usdOz = g.price;
      else approx = true;
    } else approx = true;
    if (fxRes.ok) {
      const f = (await fxRes.json()) as { rates?: { SAR?: number } };
      if (typeof f.rates?.SAR === "number" && f.rates.SAR > 0) usdSar = f.rates.SAR;
      else approx = true;
    } else approx = true;
    return pack(usdOz, usdSar, approx);
  } catch {
    return pack(FALLBACK_USD_OZ, FALLBACK_USD_SAR, true);
  }
}
