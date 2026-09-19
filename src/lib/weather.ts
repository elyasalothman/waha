import { copy, loc, type Lang } from "@/lib/locale";

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
  source: "live" | "cache";
};

const WMO: Record<number, ReturnType<typeof copy>> = {
  0: copy("صافٍ", "Clear", "晴", "Despejado", "Clair", "साफ़"),
  1: copy("غالباً صافٍ", "Mainly clear", "大部晴", "Mayormente despejado", "Plutôt clair", "अधिकतर साफ़"),
  2: copy("غائم جزئياً", "Partly cloudy", "少云", "Parcialmente nublado", "Partiellement nuageux", "आंशिक बादल"),
  3: copy("غائم", "Overcast", "阴", "Nublado", "Couvert", "बादल"),
  45: copy("ضباب", "Fog", "雾", "Niebla", "Brouillard", "कोहरा"),
  48: copy("ضباب متجمّد", "Rime fog", "霜雾", "Niebla helada", "Brouillard givrant", "पाला कोहरा"),
  51: copy("رذاذ خفيف", "Light drizzle", "小毛毛雨", "Llovizna", "Bruine", "हल्की फुहार"),
  61: copy("مطر خفيف", "Light rain", "小雨", "Lluvia ligera", "Pluie légère", "हल्की बारिश"),
  63: copy("مطر", "Rain", "雨", "Lluvia", "Pluie", "बारिश"),
  65: copy("مطر غزير", "Heavy rain", "大雨", "Lluvia fuerte", "Forte pluie", "तेज़ बारिश"),
  71: copy("ثلج", "Snow", "雪", "Nieve", "Neige", "बर्फ़"),
  80: copy("زخات", "Showers", "阵雨", "Chubascos", "Averses", "बौछार"),
  95: copy("رعد", "Thunder", "雷", "Trueno", "Tonnerre", "गरज"),
};

export function weatherLabel(code: number, lang: Lang) {
  return loc(lang, WMO[code] ?? copy("متقلب", "Mixed", "多变", "Variable", "Variable", "मिश्रित"));
}

const mem = new Map<string, { at: number; data: WeatherPayload }>();
const MEM_MS = 10 * 60 * 1000;
const LS_KEY = "waha:weather";

function keyOf(lat: number, lon: number) {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

function readLs(lat: number, lon: number): WeatherPayload | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { key: string; data: WeatherPayload; at: number };
    if (parsed.key !== keyOf(lat, lon)) return null;
    if (Date.now() - parsed.at > 6 * 3600 * 1000) return null;
    return { ...parsed.data, source: "cache" };
  } catch {
    return null;
  }
}

function writeLs(lat: number, lon: number, data: WeatherPayload) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ key: keyOf(lat, lon), data, at: Date.now() }));
  } catch {
    /* ignore */
  }
}

function remember(lat: number, lon: number, data: WeatherPayload) {
  mem.set(keyOf(lat, lon), { at: Date.now(), data });
  writeLs(lat, lon, data);
}

export function peekWeather(lat: number, lon: number): WeatherPayload | null {
  const hit = mem.get(keyOf(lat, lon));
  if (hit && Date.now() - hit.at < MEM_MS) return hit.data;
  return readLs(lat, lon);
}

async function fetchOpenMeteo(lat: number, lon: number): Promise<WeatherPayload> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
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
  const payload: WeatherPayload = {
    source: "live",
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
  remember(lat, lon, payload);
  return payload;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherPayload> {
  const cached = peekWeather(lat, lon);
  try {
    return await fetchOpenMeteo(lat, lon);
  } catch {
    if (cached) return { ...cached, source: "cache" };
    throw new Error("weather");
  }
}

/** Never throws. Always returns a payload with a temperature number. */
export async function fetchWeatherSafe(lat: number, lon: number): Promise<WeatherPayload> {
  try {
    return await fetchWeather(lat, lon);
  } catch {
    const cached = peekWeather(lat, lon);
    if (cached) return cached;
    return {
      source: "cache",
      current: { temperature: 32, apparent: 32, humidity: 15, wind: 8, code: 1 },
      daily: [],
    };
  }
}

export function weatherDegrees(w: WeatherPayload | null) {
  if (!w || typeof w.current.temperature !== "number" || Number.isNaN(w.current.temperature)) {
    return "32";
  }
  return String(Math.round(w.current.temperature));
}
