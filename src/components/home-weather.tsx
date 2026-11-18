import { Link } from "@tanstack/react-router";
import { useSettings } from "@/store/settings-store";
import { weatherLabel, type WeatherPayload } from "@/lib/weather";
import { useEffect, useState } from "react";
import { readWeatherCache, readWeatherCacheStamp, writeWeatherCache } from "@/lib/weather";
import { subscribeHomeRefresh } from "@/lib/home-refresh";
import { useAppStore } from "@/store/app-store";
export function HomeWeather({ plain = false }: { plain?: boolean }) {
  const { temperature: unit, digits, language } = useSettings((s) => s.settings);
  const [payload, setPayload] = useState<WeatherPayload | null>(null);
  const city = useAppStore((s) => s.city);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [cached, setCached] = useState(true);
  const [failed, setFailed] = useState(false);
  const [seenAt, setSeenAt] = useState<number | null>(null);
  useEffect(() => {
    let stopped = false;
    let controller: AbortController | null = null;
    const previous = readWeatherCache(city.lat, city.lon);
    setPayload(previous);
    setTemperature(previous?.current.temperature ?? null);
    setCached(true);
    setSeenAt(previous ? readWeatherCacheStamp(city.lat, city.lon) : null);
    const load = () => {
      if (stopped || !navigator.onLine) return;
      controller?.abort();
      controller = new AbortController();
      const timer = window.setTimeout(() => controller?.abort(), 8000);
      setFailed(false);
      void fetch(`/api/home-weather?lat=${city.lat.toFixed(2)}&lon=${city.lon.toFixed(2)}`, {
        signal: controller.signal,
        cache: "no-store",
      })
        .then(async (r) => {
          if (!r.ok) throw new Error();
          const data = await r.json();
          if (data.status !== "live" || !data.payload) throw new Error();
          return data.payload as WeatherPayload;
        })
        .then((data) => {
          if (stopped || controller?.signal.aborted) return;
          const at = Date.now();
          writeWeatherCache(city.lat, city.lon, data);
          setTemperature(data.current.temperature);
          setPayload(data);
          setCached(false);
          setSeenAt(at);
        })
        .catch(() => {
          if (!stopped && !controller?.signal.aborted) setFailed(true);
        })
        .finally(() => window.clearTimeout(timer));
    };
    load();
    const stop = subscribeHomeRefresh(load, true);
    return () => {
      stopped = true;
      controller?.abort();
      stop();
    };
  }, [city.lat, city.lon]);
  const format = (v: number) =>
    `${new Intl.NumberFormat(language, { numberingSystem: digits, maximumFractionDigits: 0 }).format(unit === "F" ? (v * 9) / 5 + 32 : v)}°${unit}`;
  const body = (
    <>
      <span className="kicker-oasis block">🌤️ الطقس · {city.ar}</span>
      <span className="mt-2 block text-xl">
        {temperature === null ? (plain ? "…" : "عرض التوقعات ←") : format(temperature)}
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
            ? plain
              ? "تعذّر تحديث الطقس"
              : "تعذّر تحديث الطقس؛ افتح التوقعات لإعادة المحاولة"
            : "يحتاج اتصالًا أول مرة"
          : `${
              cached
                ? seenAt
                  ? `آخر قراءة محفوظة على هذا الجهاز · ${new Intl.DateTimeFormat("ar-SA", { hour: "2-digit", minute: "2-digit" }).format(seenAt)}`
                  : "آخر قراءة محفوظة على هذا الجهاز"
                : seenAt
                  ? `جُلب من Open-Meteo · ${new Intl.DateTimeFormat("ar-SA", { hour: "2-digit", minute: "2-digit" }).format(seenAt)}`
                  : "جُلب من Open-Meteo"
            }${failed ? " · تعذّر أحدث محاولة" : ""}`}
      </span>
    </>
  );
  if (!plain) return body;
  return (
    <Link
      to="/app/$id"
      params={{ id: "weather" }}
      aria-label="الطقس"
      data-home-widget="weather"
      className="waha-card tint-oasis block focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {body}
    </Link>
  );
}
