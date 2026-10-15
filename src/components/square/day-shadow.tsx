import { useEffect, useState, type RefObject } from "react";
import { Link } from "@tanstack/react-router";
import { useHydrated } from "@/hooks/use-hydrated";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/cn";
import { HOME_SHADOW_KEYS, homeShowsCityPicker } from "@/lib/home-lock";
import { scrollToShade, type ShadeFieldLane } from "@/lib/shade-field";
import { prayerLabel, shadowDayNow } from "@/lib/shadow-day";
import { fetchWeatherSafe, formatCelsius, weatherLabel } from "@/lib/weather";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

function Pulse({ className }: { className: string }) {
  return (
    <span
      className={`inline-block animate-pulse rounded-md bg-surface-2 ${className}`}
      data-skeleton="day-shadow"
      aria-hidden="true"
    />
  );
}

/** Thin «ظل اليوم» + live next-prayer number above the Square. City stays closed. */
export function DayShadow({
  lane = "shade",
  heroRef,
}: {
  lane?: ShadeFieldLane;
  heroRef?: RefObject<HTMLElement | null>;
}) {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const hydrated = useHydrated();
  const now = useNow(1_000);
  const snap = shadowDayNow(now, city);
  const [liveWx, setLiveWx] = useState<{
    text: string;
    label: string;
    source: "live" | "cache" | "climate";
    cityKey: string;
  } | null>(null);

  useEffect(() => {
    let live = true;
    fetchWeatherSafe(city.lat, city.lon, 2000)
      .then((w) => {
        if (!live) return;
        setLiveWx({
          text: formatCelsius(w.celsius),
          source: w.source,
          cityKey: `${city.lat},${city.lon}`,
          label: weatherLabel(w.payload.current.code, lang),
        });
      })
      .catch(() => {
        /* snapshot already has a °C */
      });
    return () => {
      live = false;
    };
  }, [city.lat, city.lon, lang]);

  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const name = prayerLabel(snap, lang);
  const currentWx = liveWx?.cityKey === `${city.lat},${city.lon}` ? liveWx : null;
  const weatherSource = currentWx?.source ?? snap.weatherSource;
  const weatherText =
    weatherSource === "climate"
      ? L("الطقس غير متاح", "Weather unavailable")
      : currentWx?.text || snap.weatherText;
  const weatherSub =
    weatherSource === "climate"
      ? ""
      : weatherSource === "cache"
        ? L("آخر قراءة محفوظة", "Last saved reading")
        : currentWx?.label || "";
  const following = t(lang, "nextPrayerFollowing");

  const inField = lane === "field";

  return (
    <>
      <aside
        className={cn(
          "z-10 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 border-b border-border px-1 py-1.5 text-[12px] text-muted",
          inField && "sticky top-14",
        )}
        aria-label={t(lang, "shadowDay")}
        data-home-section="day-shadow"
        data-shadow="thin"
        data-city-picker={homeShowsCityPicker() ? "open" : "closed"}
        data-shadow-keys={HOME_SHADOW_KEYS.join(" ")}
        data-shade-lane={lane}
      >
        <button
          type="button"
          data-shade-return={inField ? "open" : "idle"}
          aria-label={inField ? t(lang, "returnToShade") : t(lang, "shadowDay")}
          onClick={() => {
            if (!inField) return;
            scrollToShade(heroRef?.current ?? null);
          }}
          className="font-medium tracking-wide text-subtle hover:text-fg"
        >
          {t(lang, "shadowDay")}
        </button>
        <span className="text-subtle">·</span>
        <span data-shadow-key="now" className="font-mono tabular-nums text-fg/80">
          {hydrated ? snap.clock : <Pulse className="h-3 w-10" />}
        </span>
        <span className="ms-auto flex flex-wrap items-center gap-x-2.5">
          <Link
            to="/app/$id"
            params={{ id: "salah" }}
            data-shadow-key="prayer"
            className="inline-flex items-center gap-1.5 hover:text-fg"
          >
            <span>{following}</span>
            <span className="font-mono tabular-nums tracking-tight text-fg" data-live="remain-hms">
              {hydrated ? snap.remainHms : <Pulse className="h-3 w-14" />}
            </span>
          </Link>
          <Link
            to="/app/$id"
            params={{ id: "weather" }}
            data-shadow-key="weather"
            className="hover:text-fg"
          >
            <span className="font-mono tabular-nums" data-live="weather">
              {hydrated ? weatherText : <Pulse className="h-3 w-10" />}
            </span>
            {hydrated ? <span className="ms-1">{weatherSub}</span> : null}
          </Link>
        </span>
      </aside>

      <section
        ref={heroRef}
        className="waha-prayer-card scroll-mt-20 px-6 py-7 sm:px-8"
        aria-label={hydrated ? `${following} ${name}` : following}
        data-hero="next-prayer"
      >
        <p className="text-xs font-medium tracking-wide text-subtle">{following}</p>
        <Link
          to="/app/$id"
          params={{ id: "salah" }}
          className="mt-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 text-fg hover:text-primary"
        >
          <h2
            className="font-display text-5xl leading-none tracking-tight sm:text-6xl"
            data-hero="prayer-name"
          >
            {hydrated ? name : <Pulse className="h-10 w-28" />}
          </h2>
          <p
            className="font-mono text-3xl tabular-nums leading-none tracking-tight text-primary sm:text-5xl"
            data-live="countdown"
          >
            {hydrated ? snap.remainShort : <Pulse className="h-9 w-24" />}
          </p>
        </Link>
        <p className="mt-2 text-sm text-muted">
          {L("موعدها", "at")}{" "}
          <span className="font-mono tabular-nums text-fg/80">
            {hydrated ? snap.prayerHm : <Pulse className="h-3 w-12" />}
          </span>
          <span className="ms-2">· {lang === "ar" ? city.ar : city.en}</span>
        </p>
      </section>
    </>
  );
}
