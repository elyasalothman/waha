import { useSettings } from "@/store/settings-store";
import { weatherLabel, type WeatherPayload } from "@/lib/weather";
import { useEffect, useState } from "react";
import { fetchWeather, readWeatherCache, writeWeatherCache } from "@/lib/weather";
import { useAppStore } from "@/store/app-store";
export function HomeWeather() {
  const { temperature: unit, digits, language } = useSettings((s) => s.settings);
  const [payload, setPayload] = useState<WeatherPayload | null>(null);
  const city = useAppStore((s) => s.city);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [cached, setCached] = useState(true);
  useEffect(() => {
    const previous = readWeatherCache(city.lat, city.lon);
    setPayload(previous);
    setTemperature(previous?.current.temperature ?? null);
    setCached(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    void fetchWeather(city.lat, city.lon, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          writeWeatherCache(city.lat, city.lon, data);
          setTemperature(data.current.temperature);
          setPayload(data);
          setCached(false);
        }
      })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [city.lat, city.lon]);
  const format = (v: number) =>
    `${new Intl.NumberFormat(language, { numberingSystem: digits, maximumFractionDigits: 0 }).format(unit === "F" ? (v * 9) / 5 + 32 : v)}°${unit}`;
  return (
    <>
      <span className="block">الطقس · {city.ar}</span>
      <span className="mt-2 block text-xl">
        {temperature === null ? "عرض التوقعات ←" : format(temperature)}
      </span>
      {payload && (
        <span className="block text-sm">
          {payload.current.code < 3 ? "☀" : "☁"} {weatherLabel(payload.current.code, "ar")}{" "}
          {payload.daily[0] &&
            ` · العظمى ${format(payload.daily[0].max)} / الصغرى ${format(payload.daily[0].min)}`}
        </span>
      )}
      <span className="text-xs text-muted">
        {temperature === null
          ? "يحتاج اتصالًا أول مرة"
          : cached
            ? "آخر قراءة محفوظة"
            : "Open-Meteo · محدث"}
      </span>
    </>
  );
}
