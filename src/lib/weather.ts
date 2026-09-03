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

export async function fetchWeather(lat: number, lon: number): Promise<WeatherPayload> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;
  const res = await fetch(url);
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
