import { useEffect, useState } from "react";
import { fetchWeather, readWeatherCache, writeWeatherCache } from "@/lib/weather";
import { useAppStore } from "@/store/app-store";
export function HomeWeather() {
  const city = useAppStore((s) => s.city);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [cached, setCached] = useState(true);
  useEffect(() => {
    const previous = readWeatherCache(city.lat, city.lon);
    setTemperature(previous?.current.temperature ?? null);
    setCached(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    void fetchWeather(city.lat, city.lon, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          writeWeatherCache(city.lat, city.lon, data);
          setTemperature(data.current.temperature);
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
  return (
    <>
      <span className="block">الطقس · {city.ar}</span>
      <span className="mt-2 block text-xl">
        {temperature === null ? "عرض التوقعات ←" : `${Math.round(temperature)}°C`}
      </span>
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
