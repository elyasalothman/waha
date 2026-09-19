import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useHydrated } from "@/hooks/use-hydrated";
import { useNow } from "@/hooks/use-now";
import { fetchWeatherSafe, formatCelsius, prefetchDefaultWeather, weatherLabel } from "@/lib/weather";
import { prayerLabel, shadowDayNow } from "@/lib/shadow-day";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

/** Instant first paint — same box as HH:MM / 36°C, no empty gap. */
function MetricSkeleton() {
  return (
    <span
      className="mt-1 inline-block h-8 w-[4.75rem] animate-pulse rounded-md bg-surface-2"
      data-skeleton="metric"
      aria-hidden="true"
    />
  );
}

function MetricValue({ ready, value }: { ready: boolean; value: string }) {
  if (!ready) return <MetricSkeleton />;
  return <p className="mt-1 min-h-8 font-mono text-2xl tabular-nums tracking-tight text-fg">{value}</p>;
}

export function ShadowDay() {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const hydrated = useHydrated();
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
        /* snapshot already has an instant °C after hydration */
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
      skeleton: false,
    },
    {
      key: "prayer",
      to: "/app/$id" as const,
      id: "salah",
      kicker: t(lang, "nextPrayerFollowing"),
      value: snap.prayerHm,
      sub: hydrated ? prayerLabel(snap, lang) : "",
      skeleton: !hydrated,
    },
    {
      key: "weather",
      to: "/app/$id" as const,
      id: "weather",
      kicker: t(lang, "weather"),
      value: weatherText,
      sub: hydrated ? weatherSub : "",
      skeleton: !hydrated,
    },
    {
      key: "hijri",
      to: "/app/$id" as const,
      id: "hijri",
      kicker: t(lang, "hijriDate"),
      value: snap.hijri,
      sub: snap.gregorian,
      skeleton: false,
    },
  ];

  return (
    <section aria-label={t(lang, "shadowDay")}>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.key}
            to={card.to}
            params={{ id: card.id }}
            className="block rounded-xl border border-border bg-surface p-4 hover:bg-surface-2"
          >
            <p className="text-xs text-muted">{card.kicker}</p>
            {card.skeleton ? (
              <MetricSkeleton />
            ) : card.key === "prayer" || card.key === "weather" ? (
              <MetricValue ready value={card.value} />
            ) : (
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
            )}
            {card.sub ? <p className="mt-1 text-sm text-muted">{card.sub}</p> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
