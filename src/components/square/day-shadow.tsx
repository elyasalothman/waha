import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useNow } from "@/hooks/use-now";
import { formatGregorian, formatHijri } from "@/lib/hijri";
import { compactRemain } from "@/lib/square/time";
import { formatHm, getTimes, nextPrayer, PRAYER_LABELS } from "@/lib/prayer";
import { fetchWeather, weatherLabel, type WeatherPayload } from "@/lib/weather";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

/** Thin “ظل اليوم” — prayer, weather, date. Must not steal the Square. */
export function DayShadow() {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const now = useNow(30_000);
  const pt = useMemo(() => getTimes(city.lat, city.lon, now), [city.lat, city.lon, now.toDateString()]);
  const next = nextPrayer(pt, now);
  const [weather, setWeather] = useState<WeatherPayload | null>(null);

  useEffect(() => {
    let live = true;
    fetchWeather(city.lat, city.lon)
      .then((w) => live && setWeather(w))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [city.lat, city.lon]);

  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <aside
      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border bg-surface/70 px-1 py-2 text-[12px] text-muted"
      aria-label={L("ظل اليوم", "Day shade")}
    >
      <span className="font-medium tracking-wide text-subtle">{L("ظل اليوم", "Day shade")}</span>
      <span className="text-border">·</span>
      <span className="text-fg/80">{lang === "ar" ? city.ar : city.en}</span>
      <span className="hidden text-fg/70 sm:inline">{formatHijri(now, lang, false)}</span>
      <span className="hidden text-subtle md:inline">{formatGregorian(now, lang)}</span>
      <span className="ms-auto flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link to="/app/$id" params={{ id: "salah" }} className="hover:text-fg">
          {PRAYER_LABELS[next.key][lang]} {L("بعد", "in")} {compactRemain(next.at.getTime() - now.getTime(), lang)}
          <span className="ms-1 text-subtle">{formatHm(next.at, lang)}</span>
        </Link>
        <Link to="/app/$id" params={{ id: "weather" }} className="hover:text-fg">
          {weather
            ? `${Math.round(weather.current.temperature)}° ${weatherLabel(weather.current.code, lang)}`
            : t(lang, "loading")}
        </Link>
      </span>
    </aside>
  );
}
