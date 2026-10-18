const OZ_GRAMS = 31.1034768;
export type GoldQuote = {
  usdOz: number;
  usdSar: number;
  sarG24: number;
  sarG21: number;
  sarG18: number;
  approx: boolean;
  updatedAt?: string;
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
  const response = await fetch("/api/gold", { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error("Gold unavailable");
  const data = await response.json();
  if (
    typeof data.usdOz !== "number" ||
    !Number.isFinite(data.usdOz) ||
    data.usdOz <= 0 ||
    typeof data.usdSar !== "number" ||
    !Number.isFinite(data.usdSar) ||
    data.usdSar <= 0
  )
    throw new Error("Invalid quote");
  return { ...pack(data.usdOz, data.usdSar, false), updatedAt: data.updatedAt };
}
