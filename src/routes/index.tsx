import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppCard, AppGrid } from "@/components/app-card";
import { CitySelect } from "@/components/city-select";
import { Card } from "@/components/ui/card";
import { byLane, featuredFor, freshFor, getApp, LANE_LABEL, WORK_LANES } from "@/lib/catalog";
import { formatDuration, formatHm, getTimes, nextPrayer, PRAYER_LABELS } from "@/lib/prayer";
import { formatGregorian, formatHijri, upcomingOccasions } from "@/lib/hijri";
import { fetchWeather, weatherLabel, type WeatherPayload } from "@/lib/weather";
import { personalPulse, workPulse, type PulseAlert, type PulseStat } from "@/lib/pulse";
import { dailyBundle } from "@/lib/daily";
import { t } from "@/lib/i18n";
import { useNow } from "@/hooks/use-now";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const audience = useAppStore((s) => s.audience);
  return audience === "work" ? <WorkHome /> : <PersonalHome />;
}

function PersonalHome() {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const recent = useAppStore((s) => s.recent);
  const now = useNow(1000);
  const pt = useMemo(() => getTimes(city.lat, city.lon, now), [city.lat, city.lon, now.toDateString()]);
  const next = nextPrayer(pt, now);
  const occasions = useMemo(() => upcomingOccasions(now, lang), [now.toDateString(), lang]);
  const daily = useMemo(() => dailyBundle(now), [now.toDateString()]);
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  const [pulse, setPulse] = useState<{ stats: PulseStat[]; alerts: PulseAlert[] }>({ stats: [], alerts: [] });

  useEffect(() => {
    let live = true;
    fetchWeather(city.lat, city.lon)
      .then((w) => live && setWeather(w))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [city.lat, city.lon]);

  useEffect(() => {
    setPulse(personalPulse());
  }, [now.toDateString()]);

  const featured = featuredFor("personal").slice(0, 6);
  const fresh = freshFor("personal").slice(0, 9);
  const recents = recent
    .map(getApp)
    .filter((x): x is NonNullable<typeof x> => x != null && x.audience.includes("personal"));

  return (
    <div className="mx-auto max-w-5xl">
      <p className="mb-1 text-xs font-medium tracking-wide text-muted">{t(lang, "personal")}</p>
      <p className="mb-4 text-sm text-muted">{t(lang, "personalIntro")}</p>
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-border bg-surface p-6 md:p-8">
          <p className="text-sm text-muted">{lang === "ar" ? city.ar : city.en}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight md:text-5xl">
            {formatHijri(now, lang, true)}
          </h1>
          <p className="mt-3 text-muted">{formatGregorian(now, lang)}</p>
          <p className="mt-4 font-mono text-3xl tabular-nums">
            {new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", {
              hour: "numeric",
              minute: "2-digit",
            }).format(now)}
          </p>
          <div className="mt-6 max-w-md">
            <CitySelect compact />
          </div>
        </div>

        <div className="grid gap-4">
          <Link to="/app/$id" params={{ id: "salah" }} className="block rounded-xl border border-border bg-surface p-5 hover:bg-surface-2">
            <p className="text-xs text-muted">{t(lang, "nextPrayer")}</p>
            <p className="mt-1 text-2xl font-medium">{PRAYER_LABELS[next.key][lang]}</p>
            <p className="mt-1 font-mono text-xl tabular-nums text-primary">{formatHm(next.at, lang)}</p>
            <p className="mt-1 text-sm text-muted">
              {t(lang, "remaining")} {formatDuration(next.at.getTime() - now.getTime(), lang)}
            </p>
          </Link>
          <Link to="/app/$id" params={{ id: "weather" }} className="block rounded-xl border border-border bg-surface p-5 hover:bg-surface-2">
            <p className="text-xs text-muted">{t(lang, "weather")}</p>
            {weather ? (
              <>
                <p className="mt-1 font-display text-3xl tabular-nums">{Math.round(weather.current.temperature)}°</p>
                <p className="text-sm text-muted">{weatherLabel(weather.current.code, lang)}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">{t(lang, "loading")}</p>
            )}
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "daily")}</h2>
        <div className="grid gap-2 md:grid-cols-3">
          <Link to="/app/$id" params={{ id: "asma" }} className="rounded-xl border border-border bg-surface p-5 hover:bg-surface-2">
            <p className="text-xs text-muted">{t(lang, "ayah")}</p>
            <p className="mt-3 font-display text-xl leading-relaxed">{daily.ayah.ar}</p>
            <p className="mt-2 text-xs text-subtle">{lang === "ar" ? daily.ayah.refAr : daily.ayah.refEn}</p>
          </Link>
          <Link to="/app/$id" params={{ id: "asma" }} className="rounded-xl border border-border bg-surface p-5 hover:bg-surface-2">
            <p className="text-xs text-muted">{t(lang, "nameOfDay")}</p>
            <p className="mt-3 font-display text-3xl">{daily.asma.ar}</p>
            <p className="mt-2 text-sm text-muted">{lang === "ar" ? daily.asma.meanAr : daily.asma.meanEn}</p>
          </Link>
          <Link to="/app/$id" params={{ id: "proverbs" }} className="rounded-xl border border-border bg-surface p-5 hover:bg-surface-2">
            <p className="text-xs text-muted">{t(lang, "saying")}</p>
            <p className="mt-3 font-display text-2xl leading-snug">{daily.proverb.ar}</p>
          </Link>
        </div>
      </section>

      {pulse.stats.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "todayStrip")}</h2>
          <div className="grid grid-cols-3 gap-2">
            {pulse.stats.map((s) => (
              <Link
                key={s.id}
                to="/app/$id"
                params={{ id: s.href }}
                className="rounded-xl border border-border bg-surface px-3 py-3 hover:bg-surface-2"
              >
                <p className="text-xs text-muted">{lang === "ar" ? s.ar : s.en}</p>
                <p className="mt-1 font-mono text-xl tabular-nums">
                  {s.value}
                  {s.max ? <span className="text-sm text-muted">/{s.max}</span> : null}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "alerts")}</h2>
        {pulse.alerts.length === 0 ? (
          <p className="text-sm text-muted">{t(lang, "noAlerts")}</p>
        ) : (
          <div className="grid gap-2">
            {pulse.alerts.map((a) => (
              <Link
                key={a.id}
                to="/app/$id"
                params={{ id: a.href }}
                className={cn(
                  "flex min-h-12 items-center rounded-xl border px-4 text-sm hover:bg-surface-2",
                  a.tone === "warn" ? "border-warn/40 bg-surface" : "border-border bg-surface",
                )}
              >
                {lang === "ar" ? a.ar : a.en}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "occasions")}</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {occasions.map((o) => (
            <Card key={o.title} className="px-3 py-3">
              <div className="text-sm">{o.title}</div>
              <div className="mt-1 font-mono text-xs tabular-nums text-muted">
                {o.days === 0 ? t(lang, "today") : `${o.days} ${t(lang, "days")}`}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {fresh.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "fresh")}</h2>
          <AppGrid items={fresh} lang={lang} />
        </section>
      ) : null}

      {recents.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "recent")}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recents.slice(0, 3).map((item) => (
              <AppCard key={item.id} item={item} lang={lang} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-medium text-muted">{t(lang, "featured")}</h2>
          <Link to="/life" className="text-sm text-primary">
            {t(lang, "catalogCta")}
          </Link>
        </div>
        <AppGrid items={featured} lang={lang} />
      </section>

      {(["worship", "civic", "home", "money", "health", "play"] as const).map((lane) => {
        const items = byLane(lane, "personal").slice(0, 6);
        if (!items.length) return null;
        return (
          <section key={lane} className="mt-10">
            <h2 className="mb-3 text-sm font-medium text-muted">{LANE_LABEL[lane][lang]}</h2>
            <AppGrid items={items} lang={lang} />
          </section>
        );
      })}
    </div>
  );
}

function WorkHome() {
  const lang = useAppStore((s) => s.lang);
  const recent = useAppStore((s) => s.recent);
  const now = useNow(1000);
  const [pulse, setPulse] = useState<{ stats: PulseStat[]; alerts: PulseAlert[] }>({ stats: [], alerts: [] });
  const featured = featuredFor("work").filter((i) => i.audience.includes("work")).slice(0, 6);
  const fresh = freshFor("work").slice(0, 9);
  const recents = recent
    .map(getApp)
    .filter((x): x is NonNullable<typeof x> => x != null && x.audience.includes("work"));

  useEffect(() => {
    setPulse(workPulse());
  }, [now.toDateString()]);

  return (
    <div className="mx-auto max-w-5xl">
      <p className="mb-1 text-xs font-medium tracking-wide text-muted">{t(lang, "work")}</p>
      <p className="mb-4 text-sm text-muted">{t(lang, "workIntro")}</p>
      <section className="rounded-xl border border-border bg-surface p-6 md:p-8">
        <p className="font-mono text-sm tabular-nums text-muted">
          {new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "numeric",
            minute: "2-digit",
          }).format(now)}
        </p>
        <h1 className="mt-3 font-display text-3xl tracking-tight md:text-4xl">{t(lang, "workBanner")}</h1>
        <p className="mt-3 max-w-2xl text-muted">{t(lang, "workBannerBody")}</p>
      </section>

      {pulse.stats.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "todayStrip")}</h2>
          <div className="grid grid-cols-3 gap-2">
            {pulse.stats.map((s) => (
              <Link
                key={s.id}
                to="/app/$id"
                params={{ id: s.href }}
                className="rounded-xl border border-border bg-surface px-3 py-3 hover:bg-surface-2"
              >
                <p className="text-xs text-muted">{lang === "ar" ? s.ar : s.en}</p>
                <p className="mt-1 font-mono text-xl tabular-nums">
                  {s.value}
                  {s.max ? <span className="text-sm text-muted">/{s.max}</span> : null}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "alerts")}</h2>
        {pulse.alerts.length === 0 ? (
          <p className="text-sm text-muted">{lang === "ar" ? "لا تنبيهات — أضف رخص المنشأة واجتماعاتك." : "No alerts — add licenses and meetings."}</p>
        ) : (
          <div className="grid gap-2">
            {pulse.alerts.map((a) => (
              <Link
                key={a.id}
                to="/app/$id"
                params={{ id: a.href }}
                className={cn(
                  "flex min-h-12 items-center rounded-xl border px-4 text-sm hover:bg-surface-2",
                  a.tone === "warn" ? "border-warn/40 bg-surface" : "border-border bg-surface",
                )}
              >
                {lang === "ar" ? a.ar : a.en}
              </Link>
            ))}
          </div>
        )}
      </section>

      {fresh.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "fresh")}</h2>
          <AppGrid items={fresh} lang={lang} />
        </section>
      ) : null}

      {recents.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "recent")}</h2>
          <AppGrid items={recents.slice(0, 3)} lang={lang} />
        </section>
      ) : null}

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-medium text-muted">{t(lang, "featured")}</h2>
          <Link to="/workspace" className="text-sm text-primary">
            {t(lang, "workCatalog")}
          </Link>
        </div>
        <AppGrid items={featured} lang={lang} />
      </section>

      {WORK_LANES.map((lane) => {
        const items = byLane(lane, "work").slice(0, 6);
        if (!items.length) return null;
        return (
          <section key={lane} className="mt-10">
            <h2 className="mb-3 text-sm font-medium text-muted">{LANE_LABEL[lane][lang]}</h2>
            <AppGrid items={items} lang={lang} />
          </section>
        );
      })}
    </div>
  );
}
