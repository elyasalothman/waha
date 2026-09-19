import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppCard, AppGrid } from "@/components/app-card";
import { DayShadow } from "@/components/day-shadow";
import { EmergencyStrip } from "@/components/emergency-strip";
import { HouseDoors } from "@/components/house-doors";
import { MoreFold } from "@/components/more-fold";
import { PrayerRemindToggle } from "@/components/prayer-remind-toggle";
import { ShareShadowButton } from "@/components/share-shadow-button";
import { Card } from "@/components/ui/card";
import { byLane, featuredFor, freshFor, getApp, LANE_LABEL, WORK_LANES } from "@/lib/catalog";
import { dailyBundle } from "@/lib/daily";
import { SA_EMERGENCY_SEGMENTS } from "@/lib/emergency-sa";
import { upcomingOccasions } from "@/lib/hijri";
import { loc, t } from "@/lib/i18n";
import { loadHomeLive } from "@/lib/live";
import { readOfflineStamp, writeOfflineStamp } from "@/lib/offline-stamp";
import { shadowPrayer } from "@/lib/prayer";
import { buildShadowShare } from "@/lib/share-shadow";
import { fetchWeatherSafe, peekWeather, type WeatherPayload } from "@/lib/weather";
import { personalPulse, workPulse, type PulseAlert, type PulseStat } from "@/lib/pulse";
import { homeWellsFor, itemFitsSegment, WELL_META } from "@/lib/segments";
import { DEFAULT_CITY } from "@/lib/cities";
import { useNow } from "@/hooks/use-now";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      return await loadHomeLive({ data: { lat: DEFAULT_CITY.lat, lon: DEFAULT_CITY.lon } });
    } catch {
      return { weather: null, headlines: [] };
    }
  },
  component: Home,
});

function Home() {
  const audience = useAppStore((s) => s.audience);
  return audience === "work" ? <WorkHome /> : <PersonalHome />;
}

function useShadowLive() {
  const city = useAppStore((s) => s.city);
  const live = Route.useLoaderData();
  const first =
    peekWeather(city.lat, city.lon) ?? readOfflineStamp()?.weather ?? live?.weather ?? null;
  const [weather, setWeather] = useState<WeatherPayload | null>(first);
  const [updatedAt, setUpdatedAt] = useState(() => readOfflineStamp()?.at ?? Date.now());

  useEffect(() => {
    let liveReq = true;
    const peek = peekWeather(city.lat, city.lon);
    if (peek) setWeather(peek);
    fetchWeatherSafe(city.lat, city.lon).then((w) => {
      if (!liveReq) return;
      setWeather(w);
      setUpdatedAt(Date.now());
    });
    return () => {
      liveReq = false;
    };
  }, [city.lat, city.lon]);

  return { weather, updatedAt };
}

function HomeWells({ segment }: { segment: Parameters<typeof homeWellsFor>[0] }) {
  const lang = useAppStore((s) => s.lang);
  return (
    <section className="mt-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {homeWellsFor(segment).map((id) => (
          <Link
            key={id}
            to={WELL_META[id].href}
            className="rounded-xl border border-border bg-surface px-4 py-4 hover:bg-surface-2"
          >
            <p className="font-medium">{loc(lang, WELL_META[id].title)}</p>
          </Link>
        ))}
        <Link to="/ask" className="rounded-xl border border-border bg-surface px-4 py-4 hover:bg-surface-2">
          <p className="font-medium">{t(lang, "ask")}</p>
        </Link>
      </div>
    </section>
  );
}

function PersonalHome() {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const recent = useAppStore((s) => s.recent);
  const segment = useAppStore((s) => s.segment);
  const labs = useAppStore((s) => s.labs);
  const displayName = useAppStore((s) => s.displayName);
  const now = useNow(1000);
  const live = Route.useLoaderData();
  const occasions = useMemo(() => upcomingOccasions(now, lang), [now.toDateString(), lang]);
  const daily = useMemo(() => dailyBundle(now), [now.toDateString()]);
  const { weather, updatedAt } = useShadowLive();
  const [pulse, setPulse] = useState<{ stats: PulseStat[]; alerts: PulseAlert[] }>({ stats: [], alerts: [] });

  useEffect(() => {
    setPulse(personalPulse());
  }, [now.toDateString()]);

  const tz = city.tz || "Asia/Riyadh";
  const prayer = useMemo(
    () => shadowPrayer(city.lat, city.lon, tz, lang, now),
    [city.lat, city.lon, tz, lang, now.getMinutes(), now.toDateString()],
  );

  useEffect(() => {
    writeOfflineStamp({
      at: updatedAt,
      cityId: city.id,
      weather,
      prayer: { nextKey: prayer.key, nextHm: prayer.hm, times: prayer.times },
      ayah: daily.ayah,
    });
  }, [weather, city.id, daily.ayah, prayer.key, prayer.hm, prayer.times, updatedAt]);

  const featured = featuredFor("personal").filter((x) => itemFitsSegment(x, segment)).slice(0, 6);
  const fresh = freshFor("personal").filter((x) => itemFitsSegment(x, segment)).slice(0, 9);
  const recents = recent
    .map(getApp)
    .filter((x): x is NonNullable<typeof x> => x != null && x.audience.includes("personal") && itemFitsSegment(x, segment));
  const headlines = labs.includes("focus") ? [] : (live?.headlines ?? []);
  const showEmergency = (SA_EMERGENCY_SEGMENTS as readonly string[]).includes(segment);
  const cityName = lang === "ar" ? city.ar : city.en;
  const sharePayload = buildShadowShare({
    lang,
    cityName,
    now,
    tz,
    prayer,
    weather,
    ayah: daily.ayah,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <p className="mb-1 text-xs font-medium tracking-wide text-muted">
        {t(lang, "personal")}
        {displayName ? ` · ${displayName}` : ""}
      </p>

      <DayShadow lang={lang} city={city} now={now} weather={weather} showQibla={labs.includes("qibla")} updatedAt={updatedAt} />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ShareShadowButton lang={lang} payload={sharePayload} />
        <PrayerRemindToggle lang={lang} lat={city.lat} lon={city.lon} tz={tz} compact />
      </div>

      {showEmergency ? <EmergencyStrip lang={lang} /> : null}

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "doors")}</h2>
        <HouseDoors lang={lang} compact />
      </section>

      <HomeWells segment={segment} />

      <MoreFold lang={lang}>
        <section>
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

        {headlines.length > 0 ? (
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted">{loc(lang, WELL_META.news.title)}</h2>
            <div className="grid gap-2">
              {headlines.slice(0, 4).map((h) => (
                <a
                  key={h.href + h.title}
                  href={h.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-border bg-surface px-4 py-3 text-sm hover:bg-surface-2"
                >
                  <span className="text-xs text-subtle">{h.source}</span>
                  <p className="mt-1">{h.title}</p>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {pulse.stats.length > 0 ? (
          <section>
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
                  <p className="num mt-1 font-mono text-xl tabular-nums">
                    {s.value}
                    {s.max ? <span className="text-sm text-muted">/{s.max}</span> : null}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section>
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

        <section>
          <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "occasions")}</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {occasions.map((o) => (
              <Card key={o.title} className="px-3 py-3">
                <div className="text-sm">{o.title}</div>
                <div className="num mt-1 font-mono text-xs tabular-nums text-muted">
                  {o.days === 0 ? t(lang, "today") : `${o.days} ${t(lang, "days")}`}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {fresh.length > 0 ? (
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "fresh")}</h2>
            <AppGrid items={fresh} lang={lang} />
          </section>
        ) : null}

        {recents.length > 0 ? (
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "recent")}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {recents.slice(0, 3).map((item) => (
                <AppCard key={item.id} item={item} lang={lang} />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-sm font-medium text-muted">{t(lang, "featured")}</h2>
            <Link to="/life" className="text-sm text-primary">
              {t(lang, "catalogCta")}
            </Link>
          </div>
          <AppGrid items={featured} lang={lang} />
        </section>

        {(["worship", "civic", "home", "money", "health", "play"] as const).map((lane) => {
          const items = byLane(lane, "personal").filter((x) => itemFitsSegment(x, segment)).slice(0, 6);
          if (!items.length) return null;
          return (
            <section key={lane}>
              <h2 className="mb-3 text-sm font-medium text-muted">{loc(lang, LANE_LABEL[lane])}</h2>
              <AppGrid items={items} lang={lang} />
            </section>
          );
        })}
      </MoreFold>
    </div>
  );
}

function WorkHome() {
  const lang = useAppStore((s) => s.lang);
  const recent = useAppStore((s) => s.recent);
  const now = useNow(1000);
  const city = useAppStore((s) => s.city);
  const { weather, updatedAt } = useShadowLive();
  const [pulse, setPulse] = useState<{ stats: PulseStat[]; alerts: PulseAlert[] }>({ stats: [], alerts: [] });
  const featured = featuredFor("work").filter((i) => i.audience.includes("work")).slice(0, 6);
  const fresh = freshFor("work").slice(0, 9);
  const recents = recent
    .map(getApp)
    .filter((x): x is NonNullable<typeof x> => x != null && x.audience.includes("work"));
  const daily = useMemo(() => dailyBundle(now), [now.toDateString()]);
  const tz = city.tz || "Asia/Riyadh";
  const prayer = useMemo(
    () => shadowPrayer(city.lat, city.lon, tz, lang, now),
    [city.lat, city.lon, tz, lang, now.getMinutes(), now.toDateString()],
  );

  useEffect(() => {
    setPulse(workPulse());
  }, [now.toDateString()]);

  useEffect(() => {
    writeOfflineStamp({
      at: updatedAt,
      cityId: city.id,
      weather,
      prayer: { nextKey: prayer.key, nextHm: prayer.hm, times: prayer.times },
      ayah: daily.ayah,
    });
  }, [weather, city.id, daily.ayah, prayer.key, prayer.hm, prayer.times, updatedAt]);

  const cityName = lang === "ar" ? city.ar : city.en;
  const sharePayload = buildShadowShare({
    lang,
    cityName,
    now,
    tz,
    prayer,
    weather,
    ayah: daily.ayah,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <p className="mb-1 text-xs font-medium tracking-wide text-muted">{t(lang, "work")}</p>
      <DayShadow lang={lang} city={city} now={now} weather={weather} updatedAt={updatedAt} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ShareShadowButton lang={lang} payload={sharePayload} />
        <PrayerRemindToggle lang={lang} lat={city.lat} lon={city.lon} tz={tz} compact />
      </div>
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "doors")}</h2>
        <HouseDoors lang={lang} compact />
      </section>
      <HomeWells segment="work" />

      <MoreFold lang={lang}>
        <section className="rounded-xl border border-border bg-surface p-6 md:p-8">
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">{t(lang, "workBanner")}</h1>
          <p className="mt-3 max-w-2xl text-muted">{t(lang, "workBannerBody")}</p>
        </section>

        {pulse.stats.length > 0 ? (
          <section>
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
                  <p className="num mt-1 font-mono text-xl tabular-nums">
                    {s.value}
                    {s.max ? <span className="text-sm text-muted">/{s.max}</span> : null}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section>
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
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "fresh")}</h2>
            <AppGrid items={fresh} lang={lang} />
          </section>
        ) : null}

        {recents.length > 0 ? (
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "recent")}</h2>
            <AppGrid items={recents.slice(0, 3)} lang={lang} />
          </section>
        ) : null}

        <section>
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
            <section key={lane}>
              <h2 className="mb-3 text-sm font-medium text-muted">{loc(lang, LANE_LABEL[lane])}</h2>
              <AppGrid items={items} lang={lang} />
            </section>
          );
        })}
      </MoreFold>
    </div>
  );
}
