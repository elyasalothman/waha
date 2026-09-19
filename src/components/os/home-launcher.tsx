import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { appIcon } from "@/lib/icons";
import { formatDuration, nextPrayerVisible } from "@/lib/prayer";
import { formatGregorian, formatHijri } from "@/lib/hijri";
import { composePersonalHome } from "@/lib/os";
import { expenseWell, waterWell } from "@/lib/home-wells";
import { t } from "@/lib/i18n";
import { useHydrated } from "@/hooks/use-hydrated";
import { useNow } from "@/hooks/use-now";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";
import { isFeatureOn } from "@/lib/features";
import { FamilyTodayPreview } from "@/components/os/family-today-board";

function greeting(lang: "ar" | "en", hour: number) {
  if (hour < 12) return t(lang, "greetDawn");
  if (hour < 17) return t(lang, "greetDay");
  return t(lang, "greetEve");
}

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-2", className)} />;
}

export function HomeLauncher() {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const name = useAppStore((s) => s.profileName);
  const features = useAppStore((s) => s.features);
  const now = useNow(1000);
  const hydrated = useHydrated();
  const surface = useMemo(() => composePersonalHome(features), [features]);
  const dayKey = now.toDateString();
  const next = nextPrayerVisible(city.lat, city.lon, now, city.tz);
  const [ready, setReady] = useState(false);
  const [wells, setWells] = useState({
    water: { value: 0, max: 8 },
    expense: { spent: 0, limit: 4000 },
  });

  useEffect(() => {
    setWells({ water: waterWell(), expense: expenseWell() });
    setReady(true);
  }, [dayKey]);

  const hello = greeting(lang, now.getHours());
  const hijri = formatHijri(now, lang);
  const gregorian = formatGregorian(now, lang);

  return (
    <div className="mx-auto max-w-lg">
      <header className="mb-8">
        <p className="text-xs tracking-wide text-muted">{t(lang, "osTagline")}</p>
        <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight">
          {hello}
          {name ? <span className="text-muted">، {name}</span> : null}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {lang === "ar" ? city.ar : city.en}
          <span className="mx-2 text-subtle">·</span>
          {hydrated && hijri.trim() ? hijri : <Pulse className="inline-block h-4 w-28 align-middle" />}
        </p>
        <p className="mt-1 text-sm text-subtle">{hydrated && gregorian.trim() ? gregorian : <Pulse className="mt-1 h-4 w-36" />}</p>
      </header>

      <Link
        to="/app/$id"
        params={{ id: "salah" }}
        className="block rounded-3xl border border-border bg-surface px-6 py-7 shadow-(--shadow-soft) transition-colors hover:bg-surface-2"
      >
        <p className="text-xs font-medium tracking-wide text-muted">{t(lang, "osShade")}</p>
        {hydrated ? (
          <>
            <p className="mt-4 font-display text-5xl leading-none">{next.label[lang]}</p>
            <p className="mt-4 font-mono text-3xl tabular-nums text-primary">{next.hm}</p>
            <p className="mt-2 text-sm text-muted">
              {t(lang, "remaining")} {formatDuration(next.at.getTime() - now.getTime(), lang)}
            </p>
          </>
        ) : (
          <>
            <Pulse className="mt-4 h-12 w-36" />
            <Pulse className="mt-4 h-9 w-24" />
            <Pulse className="mt-2 h-4 w-40" />
          </>
        )}
      </Link>

      <FamilyTodayPreview />

      {surface.wells.length ? (
        <p className="mt-3 flex items-center gap-3 px-1 text-[11px] text-subtle">
          {ready ? (
            surface.wells.map((well) => {
              const label =
                well.id === "water"
                  ? `${well.title[lang]} ${wells.water.value}/${wells.water.max}`
                  : `${well.title[lang]} ${wells.expense.spent.toLocaleString(lang === "ar" ? "ar-SA" : "en-SA")}`;
              if (well.href.startsWith("/app/")) {
                return (
                  <Link key={well.id} to="/app/$id" params={{ id: well.href.replace("/app/", "") }} className="hover:text-muted">
                    {label}
                  </Link>
                );
              }
              return (
                <Link key={well.id} to={well.href as "/"} className="hover:text-muted">
                  {label}
                </Link>
              );
            })
          ) : (
            <Pulse className="h-3 w-40" />
          )}
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="mb-4 text-sm font-medium text-muted">{t(lang, "dock")}</h2>
        <div className="grid grid-cols-4 gap-3">
          {surface.primary.map((app) => {
            const Icon = appIcon(app.icon);
            return (
              <Link key={app.id} to={app.to as "/"} className="group flex flex-col items-center gap-2">
                <span className="flex size-14 items-center justify-center rounded-2xl border border-border bg-surface text-primary shadow-(--shadow-soft) transition-colors group-hover:bg-surface-2">
                  <Icon className="size-6" strokeWidth={1.5} />
                </span>
                <span className="text-xs text-muted">{app.title[lang]}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <p className={cn("mt-12 text-center text-sm text-subtle")}>
        {isFeatureOn(features, "midan") ? (
          <Link to="/midan" className="text-muted hover:text-fg">
            {t(lang, "midan")}
          </Link>
        ) : null}
        {isFeatureOn(features, "midan") && isFeatureOn(features, "life") ? <span className="mx-2">·</span> : null}
        {isFeatureOn(features, "life") ? (
          <Link to="/life" className="text-muted hover:text-fg">
            {t(lang, "library")}
          </Link>
        ) : null}
        {isFeatureOn(features, "life") && isFeatureOn(features, "games") ? <span className="mx-2">·</span> : null}
        {isFeatureOn(features, "games") ? (
          <Link to="/games" className="text-muted hover:text-fg">
            {t(lang, "games")}
          </Link>
        ) : null}
      </p>
    </div>
  );
}
