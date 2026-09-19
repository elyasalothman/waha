import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { appIcon } from "@/lib/icons";
import { formatDuration, formatHm, getTimes, nextPrayer, PRAYER_LABELS } from "@/lib/prayer";
import { formatGregorian, formatHijri } from "@/lib/hijri";
import { composePersonalHome } from "@/lib/os";
import { expenseWell, salahWell, waterWell } from "@/lib/home-wells";
import { unreadCount } from "@/lib/messages";
import { t } from "@/lib/i18n";
import { useNow } from "@/hooks/use-now";
import { useAppStore } from "@/store/app-store";
import { useMessagesStore } from "@/store/messages-store";
import { cn } from "@/lib/cn";
import { isFeatureOn } from "@/lib/features";

function greeting(lang: "ar" | "en", hour: number) {
  if (hour < 12) return t(lang, "greetDawn");
  if (hour < 17) return t(lang, "greetDay");
  return t(lang, "greetEve");
}

export function HomeLauncher() {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const name = useAppStore((s) => s.profileName);
  const features = useAppStore((s) => s.features);
  const now = useNow(1000);
  const inbox = useMessagesStore();
  const hydrateInbox = useMessagesStore((s) => s.hydrate);
  const surface = useMemo(() => composePersonalHome(features), [features]);
  const dayKey = now.toDateString();
  const pt = useMemo(() => getTimes(city.lat, city.lon, new Date(dayKey)), [city.lat, city.lon, dayKey]);
  const next = nextPrayer(pt, now);
  const [wells, setWells] = useState({
    water: { value: 0, max: 8 },
    expense: { spent: 0, limit: 4000 },
    salah: { value: 0, max: 5 },
  });

  useEffect(() => {
    hydrateInbox();
  }, [hydrateInbox]);

  useEffect(() => {
    setWells({ water: waterWell(), expense: expenseWell(), salah: salahWell() });
  }, [dayKey]);

  const unread = unreadCount(inbox, inbox.lastReadAt);
  const hello = greeting(lang, now.getHours());

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
          {formatHijri(now, lang)}
        </p>
        <p className="mt-1 text-sm text-subtle">{formatGregorian(now, lang)}</p>
      </header>

      <Link
        to="/app/$id"
        params={{ id: "salah" }}
        className="block rounded-3xl border border-border bg-surface px-6 py-7 shadow-(--shadow-soft) transition-colors hover:bg-surface-2"
      >
        <p className="text-xs font-medium tracking-wide text-muted">{t(lang, "osShade")}</p>
        <p className="mt-4 font-display text-5xl leading-none">{PRAYER_LABELS[next.key][lang]}</p>
        <p className="mt-4 font-mono text-3xl tabular-nums text-primary">{formatHm(next.at, lang)}</p>
        <p className="mt-2 text-sm text-muted">
          {t(lang, "remaining")} {formatDuration(next.at.getTime() - now.getTime(), lang)}
        </p>
      </Link>

      <section className="mt-4 grid grid-cols-2 gap-2">
        {surface.wells.map((well) => {
          const href = well.href;
          const inner = (() => {
            if (well.id === "water") {
              return (
                <>
                  <p className="text-xs text-muted">{well.title[lang]}</p>
                  <p className="mt-2 font-mono text-2xl tabular-nums">
                    {wells.water.value}
                    <span className="text-sm text-muted">/{wells.water.max}</span>
                  </p>
                </>
              );
            }
            if (well.id === "expense") {
              return (
                <>
                  <p className="text-xs text-muted">{well.title[lang]}</p>
                  <p className="mt-2 font-mono text-2xl tabular-nums">
                    {wells.expense.spent.toLocaleString(lang === "ar" ? "ar-SA" : "en-SA")}
                  </p>
                  <p className="text-[11px] text-subtle">{t(lang, "spent")}</p>
                </>
              );
            }
            if (well.id === "inbox") {
              return (
                <>
                  <p className="text-xs text-muted">{well.title[lang]}</p>
                  <p className="mt-2 font-mono text-2xl tabular-nums">{unread}</p>
                  <p className="text-[11px] text-subtle">{t(lang, "unread")}</p>
                </>
              );
            }
            return (
              <>
                <p className="text-xs text-muted">{well.title[lang]}</p>
                <p className="mt-2 font-mono text-2xl tabular-nums">
                  {wells.salah.value}
                  <span className="text-sm text-muted">/{wells.salah.max}</span>
                </p>
              </>
            );
          })();

          if (href.startsWith("/app/")) {
            const id = href.replace("/app/", "");
            return (
              <Link
                key={well.id}
                to="/app/$id"
                params={{ id }}
                className="rounded-2xl border border-border bg-surface px-4 py-4 hover:bg-surface-2"
              >
                {inner}
              </Link>
            );
          }
          return (
            <Link key={well.id} to={href as "/"} className="rounded-2xl border border-border bg-surface px-4 py-4 hover:bg-surface-2">
              {inner}
            </Link>
          );
        })}
      </section>

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
        {surface.more.length ? (
          <div className="mt-6 grid grid-cols-4 gap-3">
            {surface.more.map((app) => {
              const Icon = appIcon(app.icon);
              return (
                <Link key={app.id} to={app.to as "/"} className="group flex flex-col items-center gap-2">
                  <span className="flex size-12 items-center justify-center rounded-2xl border border-border bg-surface text-muted group-hover:bg-surface-2 group-hover:text-fg">
                    <Icon className="size-5" strokeWidth={1.5} />
                  </span>
                  <span className="text-xs text-subtle">{app.title[lang]}</span>
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>

      <p className={cn("mt-12 text-center text-sm text-subtle")}>
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
