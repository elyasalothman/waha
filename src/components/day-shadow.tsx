import { Link } from "@tanstack/react-router";
import { CitySelect } from "@/components/city-select";
import { formatGregorian, formatHijri } from "@/lib/hijri";
import { t, type Lang } from "@/lib/i18n";
import { formatStampClock } from "@/lib/offline-stamp";
import { formatClock, shadowPrayer } from "@/lib/prayer";
import { weatherDegrees, weatherLabel, type WeatherPayload } from "@/lib/weather";
import { qiblaDeg } from "@/lib/prayer";
import type { City } from "@/lib/cities";
import { cn } from "@/lib/cn";

export function DayShadow({
  lang,
  city,
  now,
  weather,
  showQibla,
  updatedAt,
}: {
  lang: Lang;
  city: City;
  now: Date;
  weather: WeatherPayload | null;
  showQibla?: boolean;
  updatedAt?: number;
}) {
  const tz = city.tz || "Asia/Riyadh";
  const prayer = shadowPrayer(city.lat, city.lon, tz, lang, now);
  const clock = formatClock(now, lang, tz);
  const deg = weatherDegrees(weather);
  const wlabel = weather ? weatherLabel(weather.current.code, lang) : "";
  const cityName = lang === "ar" ? city.ar : city.en;
  const qibla = Math.round(qiblaDeg(city.lat, city.lon));

  return (
    <section className="grid gap-3 lg:grid-cols-[1.35fr_1fr]" data-testid="day-shadow">
      <div className="rounded-xl border border-border bg-surface p-5 md:p-7">
        <p className="text-xs font-medium tracking-wide text-muted">{t(lang, "shadow")}</p>
        <p className="mt-1 text-sm text-muted">{cityName}</p>
        <p className="mt-2 text-sm text-muted" suppressHydrationWarning>
          {formatHijri(now, lang, true)}
        </p>
        <p className="text-sm text-muted" suppressHydrationWarning>
          {formatGregorian(now, lang)}
        </p>
        <div className="mt-4">
          <p className="text-xs text-muted">{t(lang, "now")}</p>
          <p
            className="num mt-1 font-mono text-5xl tabular-nums leading-none tracking-tight md:text-6xl"
            data-testid="shadow-clock"
            suppressHydrationWarning
          >
            {clock}
          </p>
        </div>
        <div className="mt-5 max-w-md">
          <CitySelect compact />
        </div>
        <p className="mt-4 text-xs text-subtle" data-testid="last-updated" suppressHydrationWarning>
          {t(lang, "lastUpdated")}
          {weather?.source === "cache" ? ` · ${t(lang, "offline")}` : ""}
          {" · "}
          <span className="num font-mono tabular-nums">{formatStampClock(updatedAt ?? now.getTime(), lang, tz)}</span>
        </p>
      </div>

      <div className="grid gap-3">
        <Link
          to="/app/$id"
          params={{ id: "salah" }}
          className="block rounded-xl border border-border bg-surface p-5 hover:bg-surface-2"
          data-testid="shadow-prayer"
        >
          <p className="text-xs text-muted">{t(lang, "nextPrayer")}</p>
          <p className="mt-1 text-2xl font-medium">{prayer.name}</p>
          <p className="num mt-1 font-mono text-3xl tabular-nums text-primary" suppressHydrationWarning>
            {prayer.hm}
          </p>
          <p className="mt-1 text-sm text-muted">
            {t(lang, "remaining")} <span className="num font-mono tabular-nums">{prayer.remain}</span>
          </p>
          <p className="mt-2 text-[11px] text-subtle">{t(lang, "method")}</p>
        </Link>

        <Link
          to="/app/$id"
          params={{ id: "weather" }}
          className="block rounded-xl border border-border bg-surface p-5 hover:bg-surface-2"
          data-testid="shadow-weather"
        >
          <p className="text-xs text-muted">{t(lang, "weather")}</p>
          <p className="num mt-1 font-mono text-4xl tabular-nums leading-none">
            {deg}
            <span className="text-2xl">°</span>
          </p>
          {wlabel ? <p className="mt-2 text-sm text-muted">{wlabel}</p> : null}
        </Link>

        {showQibla ? (
          <Link
            to="/app/$id"
            params={{ id: "qibla" }}
            className="rounded-xl border border-border bg-surface px-5 py-4 hover:bg-surface-2"
          >
            <p className="text-xs text-muted">
              {lang === "ar" ? "القبلة" : "Qibla"} · <span className="num font-mono tabular-nums">{qibla}°</span>
            </p>
          </Link>
        ) : null}
      </div>

      <ol className="grid grid-cols-3 gap-1.5 lg:col-span-2 sm:grid-cols-6">
        {prayer.times.map((row) => (
          <li
            key={row.key}
            className={cn(
              "rounded-lg border border-border/80 bg-surface px-2 py-2",
              row.key === prayer.key && "border-primary/40",
            )}
          >
            <p className="text-[10px] text-muted">{row.name}</p>
            <p className="num mt-0.5 font-mono text-xs tabular-nums">{row.hm}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
