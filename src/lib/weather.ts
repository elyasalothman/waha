export type WeatherCurrent = {
  temperature: number;
  apparent: number;
  humidity: number;
  wind: number;
  code: number;
};

export type WeatherDay = {
  date: string;
  code: number;
  max: number;
  min: number;
};

export type WeatherPayload = {
  current: WeatherCurrent;
  daily: WeatherDay[];
};

const WMO: Record<number, { ar: string; en: string }> = {
  0: { ar: "صافٍ", en: "Clear" },
  1: { ar: "غالباً صافٍ", en: "Mainly clear" },
  2: { ar: "غائم جزئياً", en: "Partly cloudy" },
  3: { ar: "غائم", en: "Overcast" },
  45: { ar: "ضباب", en: "Fog" },
  48: { ar: "ضباب متجمّد", en: "Rime fog" },
  51: { ar: "رذاذ خفيف", en: "Light drizzle" },
  61: { ar: "مطر خفيف", en: "Light rain" },
  63: { ar: "مطر", en: "Rain" },
  65: { ar: "مطر غزير", en: "Heavy rain" },
  71: { ar: "ثلج", en: "Snow" },
  80: { ar: "زخات", en: "Showers" },
  95: { ar: "رعد", en: "Thunder" },
};

export function weatherLabel(code: number, lang: "ar" | "en") {
  return (WMO[code] ?? { ar: "متقلب", en: "Mixed" })[lang];
}

export type WeatherSource = "live" | "cache" | "climate";

export type WeatherSafe = {
  payload: WeatherPayload;
  source: WeatherSource;
  celsius: number;
};

const memory = new Map<string, { at: number; payload: WeatherPayload }>();
const CACHE_KEY = "waha:weather:v1";
const TTL_MS = 30 * 60 * 1000;

/** Riyadh-ish monthly mean °C — last-resort number so the card never stays on — */
const RIYADH_MONTH_C = [15, 18, 22, 28, 34, 37, 38, 38, 35, 29, 21, 16];

export function weatherCacheKey(lat: number, lon: number) {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export function climateFallbackC(month = new Date().getMonth()): number {
  return RIYADH_MONTH_C[Math.max(0, Math.min(11, month))] ?? 30;
}

export function climatePayload(month = new Date().getMonth()): WeatherPayload {
  const t = climateFallbackC(month);
  return {
    current: { temperature: t, apparent: t, humidity: 18, wind: 12, code: 1 },
    daily: [],
  };
}

function canUseStorage() {
  return typeof localStorage !== "undefined";
}

export function readWeatherCache(lat: number, lon: number): WeatherPayload | null {
  const key = weatherCacheKey(lat, lon);
  const mem = memory.get(key);
  if (mem && Date.now() - mem.at < TTL_MS) return mem.payload;
  if (!canUseStorage()) return mem?.payload ?? null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return mem?.payload ?? null;
    const parsed = JSON.parse(raw) as Record<string, { at: number; payload: WeatherPayload }>;
    const hit = parsed[key];
    if (hit?.payload?.current && Number.isFinite(hit.payload.current.temperature)) {
      memory.set(key, hit);
      return hit.payload;
    }
  } catch {
    /* ignore */
  }
  return mem?.payload ?? null;
}

export function writeWeatherCache(lat: number, lon: number, payload: WeatherPayload) {
  const key = weatherCacheKey(lat, lon);
  const entry = { at: Date.now(), payload };
  memory.set(key, entry);
  if (!canUseStorage()) return;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, { at: number; payload: WeatherPayload }>) : {};
    parsed[key] = entry;
    localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
  } catch {
    /* ignore */
  }
}

export function formatCelsius(temp: number): string {
  const n = Number.isFinite(temp) ? Math.round(temp) : climateFallbackC();
  return `${n}°C`;
}

export async function fetchWeather(lat: number, lon: number, signal?: AbortSignal): Promise<WeatherPayload> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("weather");
  const data = (await res.json()) as {
    current: {
      temperature_2m: number;
      apparent_temperature: number;
      relative_humidity_2m: number;
      wind_speed_10m: number;
      weather_code: number;
    };
    daily: {
      time: string[];
      weather_code: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
    };
  };
  return {
    current: {
      temperature: data.current.temperature_2m,
      apparent: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      wind: data.current.wind_speed_10m,
      code: data.current.weather_code,
    },
    daily: data.daily.time.map((date, i) => ({
      date,
      code: data.daily.weather_code[i]!,
      max: data.daily.temperature_2m_max[i]!,
      min: data.daily.temperature_2m_min[i]!,
    })),
  };
}

function pack(payload: WeatherPayload, source: WeatherSource): WeatherSafe {
  const raw = payload.current.temperature;
  const celsius = Number.isFinite(raw) ? raw : climateFallbackC();
  return { payload, source, celsius };
}

/** Open-Meteo with 2s budget, cache, then climate — always a °C number, never a dash. */
export async function fetchWeatherSafe(
  lat: number,
  lon: number,
  timeoutMs = 2000,
): Promise<WeatherSafe> {
  const cached = readWeatherCache(lat, lon);
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const payload = await fetchWeather(lat, lon, ac.signal);
    if (Number.isFinite(payload.current.temperature)) {
      writeWeatherCache(lat, lon, payload);
      return pack(payload, "live");
    }
  } catch {
    /* timeout / network / parse */
  } finally {
    clearTimeout(timer);
  }
  if (cached && Number.isFinite(cached.current.temperature)) {
    return pack(cached, "cache");
  }
  return pack(climatePayload(), "climate");
}

/** Warm Riyadh cache so the home card can paint a number on first visit. */
export function prefetchDefaultWeather() {
  void fetchWeatherSafe(24.7136, 46.6753, 2000);
}
