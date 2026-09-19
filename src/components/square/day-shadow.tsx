import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useNow } from "@/hooks/use-now";
import { nextPrayerVisible } from "@/lib/prayer";
import { compactRemain } from "@/lib/square/time";
import { prayerLabel, shadowDayNow } from "@/lib/shadow-day";
import { fetchWeatherSafe, formatCelsius, weatherLabel } from "@/lib/weather";
import { useAppStore } from "@/store/app-store";

/** Compressed “ظل اليوم” — one line. Must not steal the Square. */
export function DayShadow() {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const now = useNow(30_000);
  const snap = shadowDayNow(now, city);
  const next = nextPrayerVisible(city.lat, city.lon, now, city.tz);
  const [liveWx, setLiveWx] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchWeatherSafe(city.lat, city.lon, 2000)
      .then((w) => {
        if (!live) return;
        setLiveWx(`${formatCelsius(w.celsius)} ${weatherLabel(w.payload.current.code, lang)}`);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [city.lat, city.lon, lang]);

  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const weather = liveWx ?? `${snap.weatherText} ${lang === "ar" ? snap.weatherLabelAr : snap.weatherLabelEn}`;

  return (
    <aside
      className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 border-b border-border px-1 py-1.5 text-[12px] text-muted"
      aria-label={L("ظل اليوم", "Day shade")}
    >
      <span className="text-fg/80">{lang === "ar" ? snap.cityAr : snap.cityEn}</span>
      <span className="hidden text-subtle sm:inline">{snap.hijri}</span>
      <span className="ms-auto flex flex-wrap items-center gap-x-2.5">
        <Link to="/app/$id" params={{ id: "salah" }} className="hover:text-fg">
          {prayerLabel(snap, lang)} {snap.prayerHm}
          <span className="ms-1 text-subtle">
            {L("بعد", "in")} {compactRemain(next.at.getTime() - now.getTime(), lang)}
          </span>
        </Link>
        <Link to="/app/$id" params={{ id: "weather" }} className="hover:text-fg">
          {weather}
        </Link>
      </span>
    </aside>
  );
}
