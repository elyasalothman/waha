import { useEffect, useState } from "react";
import { CitySelect } from "@/components/city-select";
import { Card } from "@/components/ui/card";
import { fetchWeather, weatherLabel, type WeatherPayload } from "@/lib/weather";
import { markLiveFetch } from "@/lib/live-stamp";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export function WeatherApp() {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const [data, setData] = useState<WeatherPayload | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let live = true;
    setErr(false);
    fetchWeather(city.lat, city.lon)
      .then((w) => {
        if (!live) return;
        setData(w);
        markLiveFetch("weather", Date.now(), localStorage);
      })
      .catch(() => live && setErr(true));
    return () => {
      live = false;
    };
  }, [city.lat, city.lon]);

  return (
    <div className="space-y-4">
      <CitySelect />
      {err ? <p className="text-sm text-danger">{t(lang, "error")}</p> : null}
      {!data && !err ? <p className="text-sm text-muted">{t(lang, "loading")}</p> : null}
      {data ? (
        <>
          <Card className="p-5">
            <p className="text-xs text-muted">{lang === "ar" ? city.ar : city.en}</p>
            <p className="mt-1 font-display text-5xl tabular-nums">{Math.round(data.current.temperature)}°</p>
            <p className="mt-2 text-muted">{weatherLabel(data.current.code, lang)}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-xs text-subtle">{t(lang, "feels")}</div>
                <div className="tabular-nums">{Math.round(data.current.apparent)}°</div>
              </div>
              <div>
                <div className="text-xs text-subtle">{t(lang, "humidity")}</div>
                <div className="tabular-nums">{data.current.humidity}%</div>
              </div>
              <div>
                <div className="text-xs text-subtle">{t(lang, "wind")}</div>
                <div className="tabular-nums">{Math.round(data.current.wind)} {lang === "ar" ? "كم/س" : "km/h"}</div>
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {data.daily.map((d) => (
              <div key={d.date} className="rounded-lg border border-border bg-surface px-3 py-3">
                <div className="text-xs text-muted">
                  {new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", { weekday: "short" }).format(
                    new Date(d.date + "T12:00:00"),
                  )}
                </div>
                <div className="mt-2 text-sm">{weatherLabel(d.code, lang)}</div>
                <div className="mt-1 font-mono text-sm tabular-nums">
                  {Math.round(d.max)}° / {Math.round(d.min)}°
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
