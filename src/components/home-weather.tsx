import { useSettings } from "@/store/settings-store";
import { weatherLabel, type WeatherPayload } from "@/lib/weather";
import { useEffect, useState } from "react";
import { readWeatherCache, writeWeatherCache } from "@/lib/weather";
import { useAppStore } from "@/store/app-store";
export function HomeWeather() {
  const { temperature: unit, digits, language } = useSettings((s) => s.settings);
  const [payload, setPayload] = useState<WeatherPayload | null>(null);
  const city = useAppStore((s) => s.city);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [cached, setCached] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const previous = readWeatherCache(city.lat, city.lon);
    setPayload(previous);
    setTemperature(previous?.current.temperature ?? null);
    setCached(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    setFailed(false);
    void fetch(`/api/home-weather?lat=${city.lat.toFixed(2)}&lon=${city.lon.toFixed(2)}`, {
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const data = await r.json();
        if (data.status !== "live" || !data.payload) throw new Error();
        return data.payload as WeatherPayload;
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          writeWeatherCache(city.lat, city.lon, data);
          setTemperature(data.current.temperature);
          setPayload(data);
          setCached(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      })
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
          ? failed
            ? "تعذّر تحديث الطقس؛ افتح التوقعات لإعادة المحاولة"
            : "يحتاج اتصالًا أول مرة"
          : cached
            ? "آخر قراءة محفوظة"
            : "Open-Meteo · محدث"}
      </span>
    </>
  );
}
