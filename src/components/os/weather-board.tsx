import { useEffect, useState } from "react";
import { CitySelect } from "@/components/city-select";
import { Button } from "@/components/ui/button";
import { loadWeather, weatherInstant, weatherLabel, type WeatherLoad } from "@/lib/weather";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

function hourLabel(iso: string, lang: "ar" | "en", timezone: string, offset: number) {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", {
    hour: "numeric",
    timeZone: timezone,
  }).format(weatherInstant(iso, offset));
}

function dayLabel(iso: string, lang: "ar" | "en") {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", {
    weekday: "long",
  }).format(new Date(iso + "T12:00:00"));
}

export function WeatherBoard() {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const [load, setLoad] = useState<WeatherLoad | null>(null);
  const [err, setErr] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    setErr(false);
    loadWeather(city.lat, city.lon)
      .then((w) => {
        if (live) setLoad(w);
      })
      .catch(() => {
        if (live) {
          setLoad(null);
          setErr(true);
        }
      });
    return () => {
      live = false;
    };
  }, [city.lat, city.lon, tick]);

  const data = load?.data ?? null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="text-xs tracking-wide text-muted">{t(lang, "weather")}</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{lang === "ar" ? city.ar : city.en}</h1>
      </header>
      <CitySelect />
      {load?.stale ? <p className="text-sm text-warn">{t(lang, "weatherStale")}</p> : null}
      {err && !data ? (
        <div className="rounded-3xl border border-border bg-surface px-6 py-8">
          <p className="text-sm text-muted">{t(lang, "error")}</p>
          <Button className="mt-4" type="button" onClick={() => setTick((n) => n + 1)}>
            {t(lang, "weatherRetry")}
          </Button>
        </div>
      ) : null}
      {!data && !err ? <p className="text-sm text-muted">{t(lang, "loading")}</p> : null}
      {data ? (
        <>
          <section className="rounded-3xl border border-border bg-surface px-6 py-8 shadow-(--shadow-soft)">
            <p className="font-display text-7xl tabular-nums leading-none">{Math.round(data.current.temperature)}°</p>
            <p className="mt-3 text-lg text-muted">{weatherLabel(data.current.code, lang)}</p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-xs text-subtle">{t(lang, "feels")}</div>
                <div className="mt-1 tabular-nums">{Math.round(data.current.apparent)}°</div>
              </div>
              <div>
                <div className="text-xs text-subtle">{t(lang, "humidity")}</div>
                <div className="mt-1 tabular-nums">{data.current.humidity}%</div>
              </div>
              <div>
                <div className="text-xs text-subtle">{t(lang, "wind")}</div>
                <div className="mt-1 tabular-nums">
                  {Math.round(data.current.wind)} {lang === "ar" ? "كم/س" : "km/h"}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "hourly")}</h2>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
              {data.hourly.map((h) => (
                <div key={h.time} className="min-w-[4.5rem] rounded-2xl border border-border bg-surface px-3 py-3 text-center">
                  <p className="text-[11px] text-subtle">{hourLabel(h.time, lang, data.timezone ?? "Asia/Riyadh", data.utcOffsetSeconds ?? 10800)}</p>
                  <p className="mt-2 font-mono text-lg tabular-nums">{Math.round(h.temperature)}°</p>
                  <p className="mt-1 text-[11px] text-muted">{weatherLabel(h.code, lang)}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "dailyForecast")}</h2>
            <div className="space-y-2">
              {data.daily.map((d) => (
                <div key={d.date} className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
                  <div>
                    <p className="text-sm">{dayLabel(d.date, lang)}</p>
                    <p className="text-xs text-muted">{weatherLabel(d.code, lang)}</p>
                  </div>
                  <p className="font-mono text-sm tabular-nums">
                    {Math.round(d.max)}° / {Math.round(d.min)}°
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
