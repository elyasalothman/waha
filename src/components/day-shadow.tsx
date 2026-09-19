import { Link } from "@tanstack/react-router";
import { formatGregorian, formatHijri } from "@/lib/hijri";
import { t, type Lang } from "@/lib/i18n";
import { formatStampClock } from "@/lib/offline-stamp";
import { formatClock, shadowPrayer } from "@/lib/prayer";
import type { WeatherPayload } from "@/lib/weather";
import type { City } from "@/lib/cities";
import { cn } from "@/lib/cn";

export function DayShadow({
  lang,
  city,
  now,
  weather,
  updatedAt,
}: {
  lang: Lang;
  city: City;
  now: Date;
  weather: WeatherPayload | null;
  updatedAt?: number;
}) {
  const tz = city.tz || "Asia/Riyadh";
  const prayer = shadowPrayer(city.lat, city.lon, tz, lang, now);
  const clock = formatClock(now, lang, tz);
  const cityName = lang === "ar" ? city.ar : city.en;

  return (
    <section className="rounded-xl border border-border bg-surface px-5 py-6 md:px-7 md:py-7" data-testid="day-shadow">
      <p className="text-xs font-medium tracking-wide text-muted">
        {t(lang, "shadow")}
        <span className="text-subtle"> · </span>
        {cityName}
      </p>
      <p className="mt-1 text-sm text-muted" suppressHydrationWarning>
        {formatHijri(now, lang, true)}
      </p>
      <p className="text-sm text-muted" suppressHydrationWarning>
        {formatGregorian(now, lang)}
      </p>

      <Link
        to="/app/$id"
        params={{ id: "salah" }}
        className="mt-5 block rounded-lg py-1 hover:bg-surface-2/60"
        data-testid="shadow-prayer"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted">{t(lang, "nextPrayer")}</p>
            <p className="mt-1 font-display text-4xl tracking-tight md:text-5xl">{prayer.name}</p>
          </div>
          <div className="text-end">
            <p className="num font-mono text-3xl tabular-nums text-primary md:text-4xl" suppressHydrationWarning>
              {prayer.hm}
            </p>
            <p className="mt-1 text-sm text-muted">
              {t(lang, "remaining")} <span className="num font-mono tabular-nums">{prayer.remain}</span>
            </p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-subtle">
          {t(lang, "method")}
          <span className="text-subtle"> · </span>
          <span className="num font-mono tabular-nums" data-testid="shadow-clock" suppressHydrationWarning>
            {clock}
          </span>
        </p>
      </Link>

      <ol className="mt-5 grid grid-cols-3 gap-x-3 gap-y-2 sm:grid-cols-6" data-testid="shadow-chips">
        {prayer.times.map((row) => (
          <li
            key={row.key}
            className={cn(
              "border-b border-transparent pb-1",
              row.key === prayer.key ? "border-primary/35 text-fg" : "text-muted",
            )}
          >
            <p className="text-[10px] tracking-wide">{row.name}</p>
            <p className="num mt-0.5 font-mono text-xs tabular-nums">{row.hm}</p>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-xs text-subtle" data-testid="last-updated" suppressHydrationWarning>
        {t(lang, "lastUpdated")}
        {weather?.source === "cache" ? ` · ${t(lang, "offline")}` : ""}
        {" · "}
        <span className="num font-mono tabular-nums">{formatStampClock(updatedAt ?? now.getTime(), lang, tz)}</span>
      </p>
    </section>
  );
}
