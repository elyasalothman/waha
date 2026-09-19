export type WeatherCurrent = {
  temperature: number;
  apparent: number;
  humidity: number;
  wind: number;
  code: number;
};

export type WeatherHour = {
  time: string;
  temperature: number;
  code: number;
  humidity: number;
  precip: number;
};

export type WeatherDay = {
  date: string;
  code: number;
  max: number;
  min: number;
};

export type WeatherPayload = {
  current: WeatherCurrent;
  hourly: WeatherHour[];
  daily: WeatherDay[];
  fetchedAt: number;
  timezone: string;
  utcOffsetSeconds: number;
};

export type WeatherLoad = {
  data: WeatherPayload;
  source: "live" | "cache" | "climate";
  stale: boolean;
};

export type WeatherSource = "live" | "cache" | "climate";

export type WeatherSafe = {
  payload: WeatherPayload;
  source: WeatherSource;
  celsius: number;
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

export const WEATHER_CACHE_KEY = "waha:weather-cache";
const CACHE_KEY = "waha:weather:v1";
const TTL_MS = 30 * 60 * 1000;
const memory = new Map<string, { at: number; payload: WeatherPayload }>();

/** Riyadh-ish monthly mean °C — last-resort number so the card never stays on — */
const RIYADH_MONTH_C = [15, 18, 22, 28, 34, 37, 38, 38, 35, 29, 21, 16];

export function weatherLabel(code: number, lang: "ar" | "en") {
  return (WMO[code] ?? { ar: "متقلب", en: "Mixed" })[lang];
}

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
    hourly: [],
    daily: [],
    fetchedAt: 0,
    timezone: "Asia/Riyadh",
    utcOffsetSeconds: 10800,
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
    const raw = localStorage.getItem(CACHE_KEY) ?? localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return mem?.payload ?? null;
    const parsed = JSON.parse(raw) as
      | Record<string, { at: number; payload: WeatherPayload }>
      | { lat?: number; lon?: number; payload?: WeatherPayload };
    if (parsed && "payload" in parsed && parsed.payload?.current) {
      return parsed.payload;
    }
    const hit = (parsed as Record<string, { at: number; payload: WeatherPayload }>)[key];
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

function forecastUrl(lat: number, lon: number) {
  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature` +
    `&hourly=temperature_2m,relative_humidity_2m,weather_code,precipitation_probability` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&timezone=auto&forecast_days=7`
  );
}

function offsetStamp(seconds: number) {
  const sign = seconds >= 0 ? "+" : "-";
  const abs = Math.abs(seconds);
  const h = String(Math.floor(abs / 3600)).padStart(2, "0");
  const m = String(Math.floor((abs % 3600) / 60)).padStart(2, "0");
  return `${sign}${h}:${m}`;
}

/** Open-Meteo city-local ISO → absolute instant using the forecast offset. */
export function weatherInstant(iso: string, utcOffsetSeconds: number) {
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(iso)) return new Date(iso);
  const stamp = iso.length === 16 ? `${iso}:00` : iso;
  return new Date(`${stamp}${offsetStamp(utcOffsetSeconds)}`);
}

type OpenMeteoResponse = {
  timezone?: string;
  utc_offset_seconds?: number;
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    relative_humidity_2m: number[];
    precipitation_probability: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
};

export function parseWeather(data: OpenMeteoResponse, fetchedAt = Date.now()): WeatherPayload {
  const utcOffsetSeconds = data.utc_offset_seconds ?? 0;
  const timezone = data.timezone ?? "UTC";
  const hourly: WeatherHour[] = [];
  const hours = data.hourly;
  if (hours?.time?.length) {
    for (let i = 0; i < hours.time.length; i += 1) {
      const t = hours.time[i]!;
      if (weatherInstant(t, utcOffsetSeconds).getTime() + 30 * 60 * 1000 < fetchedAt) continue;
      hourly.push({
        time: t,
        temperature: hours.temperature_2m[i]!,
        code: hours.weather_code[i]!,
        humidity: hours.relative_humidity_2m[i]!,
        precip: hours.precipitation_probability[i] ?? 0,
      });
      if (hourly.length >= 24) break;
    }
  }
  return {
    current: {
      temperature: data.current.temperature_2m,
      apparent: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      wind: data.current.wind_speed_10m,
      code: data.current.weather_code,
    },
    hourly,
    daily: data.daily.time.map((date, i) => ({
      date,
      code: data.daily.weather_code[i]!,
      max: data.daily.temperature_2m_max[i]!,
      min: data.daily.temperature_2m_min[i]!,
    })),
    fetchedAt,
    timezone,
    utcOffsetSeconds,
  };
}

export async function fetchWeather(
  lat: number,
  lon: number,
  signalOrFetch?: AbortSignal | typeof fetch,
): Promise<WeatherPayload> {
  const fetchImpl = typeof signalOrFetch === "function" ? signalOrFetch : fetch;
  const signal = signalOrFetch instanceof AbortSignal ? signalOrFetch : undefined;
  const res = await fetchImpl(forecastUrl(lat, lon), signal ? { signal } : undefined);
  if (!res.ok) throw new Error("weather");
  const data = (await res.json()) as OpenMeteoResponse;
  if (!data.current || !data.daily?.time?.length) throw new Error("weather-shape");
  const payload = parseWeather(data);
  writeWeatherCache(lat, lon, payload);
  return payload;
}

function pack(payload: WeatherPayload, source: WeatherSource): WeatherSafe {
  const raw = payload.current.temperature;
  const celsius = Number.isFinite(raw) ? raw : climateFallbackC();
  return { payload, source, celsius };
}

/** Open-Meteo with 2s budget, cache, then climate — always a °C number, never a dash. */
export async function fetchWeatherSafe(lat: number, lon: number, timeoutMs = 2000): Promise<WeatherSafe> {
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

/** Live Open-Meteo, then cache, then climate. Never a permanent blank. */
export async function loadWeather(lat: number, lon: number, fetchImpl: typeof fetch = fetch): Promise<WeatherLoad> {
  const cached = readWeatherCache(lat, lon);
  try {
    const live = await fetchWeather(lat, lon, fetchImpl);
    return { data: live, source: "live", stale: false };
  } catch {
    if (cached) return { data: cached, source: "cache", stale: true };
    return { data: climatePayload(), source: "climate", stale: true };
  }
}
