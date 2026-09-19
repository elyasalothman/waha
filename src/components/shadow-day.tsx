import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useNow } from "@/hooks/use-now";
import { fetchWeatherSafe, formatCelsius, prefetchDefaultWeather, weatherLabel } from "@/lib/weather";
import { prayerLabel, shadowDayNow } from "@/lib/shadow-day";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

export function ShadowDay() {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const now = useNow(1000);
  const snap = shadowDayNow(now, city);
  const [liveWx, setLiveWx] = useState<{ text: string; label: string } | null>(null);

  useEffect(() => {
    prefetchDefaultWeather();
  }, []);

  useEffect(() => {
    let live = true;
    setLiveWx(null);
    fetchWeatherSafe(city.lat, city.lon, 2000)
      .then((w) => {
        if (!live) return;
        setLiveWx({
          text: formatCelsius(w.celsius),
          label: weatherLabel(w.payload.current.code, lang),
        });
      })
      .catch(() => {
        /* snapshot already shows an instant °C */
      });
    return () => {
      live = false;
    };
  }, [city.lat, city.lon, lang]);

  const weatherText = liveWx?.text || snap.weatherText;
  const weatherSub = liveWx?.label || (lang === "ar" ? snap.weatherLabelAr : snap.weatherLabelEn);

  const cards = [
    {
      key: "now",
      to: "/app/$id" as const,
      id: "clocks",
      kicker: t(lang, "nowLabel"),
      value: snap.clock,
      sub: lang === "ar" ? snap.cityAr : snap.cityEn,
    },
    {
      key: "prayer",
      to: "/app/$id" as const,
      id: "salah",
      kicker: t(lang, "nextPrayerFollowing"),
      value: snap.prayerHm,
      sub: prayerLabel(snap, lang),
    },
    {
      key: "weather",
      to: "/app/$id" as const,
      id: "weather",
      kicker: t(lang, "weather"),
      value: weatherText,
      sub: weatherSub,
    },
    {
      key: "hijri",
      to: "/app/$id" as const,
      id: "hijri",
      kicker: t(lang, "hijriDate"),
      value: snap.hijri,
      sub: snap.gregorian,
    },
  ];

  return (
    <section aria-label={t(lang, "shadowDay")}>
      <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "shadowDay")}</h2>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.key}
            to={card.to}
            params={{ id: card.id }}
            className="block rounded-xl border border-border bg-surface p-4 hover:bg-surface-2"
          >
            <p className="text-xs text-muted">{card.kicker}</p>
            <p
              className={cn(
                "mt-1 text-fg",
                card.key === "hijri"
                  ? "font-display text-xl leading-snug"
                  : "font-mono text-2xl tabular-nums tracking-tight",
              )}
            >
              {card.value}
            </p>
            {card.sub ? <p className="mt-1 text-sm text-muted">{card.sub}</p> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
