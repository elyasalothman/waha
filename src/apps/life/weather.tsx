import { useEffect, useState } from "react";
import { CitySelect } from "@/components/city-select";
import { Card } from "@/components/ui/card";
import {
  fetchWeather,
  readWeatherCache,
  writeWeatherCache,
  weatherLabel,
  type WeatherPayload,
} from "@/lib/weather";
import { markLiveFetch } from "@/lib/live-stamp";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export function WeatherApp() {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const [data, setData] = useState<WeatherPayload | null>(null);
  const [err, setErr] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [retry, setRetry] = useState(0);
  const lat = coords?.lat ?? city.lat,
    lon = coords?.lon ?? city.lon;

  useEffect(() => {
    let live = true;
    setErr(false);
    setData(readWeatherCache(lat, lon));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    fetchWeather(lat, lon, controller.signal)
      .then((w) => {
        if (!live) return;
        writeWeatherCache(lat, lon, w);
        setData(w);
        markLiveFetch("weather", Date.now(), localStorage);
      })
      .catch(() => live && setErr(true));
    return () => {
      live = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [lat, lon, retry]);

  return (
    <div className="space-y-4">
      <CitySelect />
      <div className="flex flex-wrap gap-2">
        <button
          className="min-h-11 rounded-xl border border-border px-4"
          onClick={() => {
            setLocationError("");
            if (!navigator.geolocation)
              return setLocationError("الموقع غير متاح؛ يمكنك اختيار المدينة.");
            navigator.geolocation.getCurrentPosition(
              (p) => setCoords({ lat: p.coords.latitude, lon: p.coords.longitude }),
              () => setLocationError("تعذر تحديد الموقع أو رُفض الإذن. اختر مدينتك."),
              { timeout: 10000 },
            );
          }}
        >
          استخدم موقعي
        </button>
        <button
          className="min-h-11 rounded-xl border border-border px-4"
          onClick={() => {
            setCoords(null);
            setRetry((n) => n + 1);
          }}
        >
          تحديث طقس المدينة
        </button>
      </div>
      {locationError && <p role="alert">{locationError}</p>}
      <p className="text-xs text-muted">
        المصدر: Open-Meteo ·{" "}
        {data?.updatedAt
          ? `آخر تحديث ${new Date(data.updatedAt).toLocaleString("ar-SA")}`
          : "بانتظار البيانات"}
      </p>
      {err ? (
        <p className="text-sm text-danger">
          {data
            ? "تعذر التحديث؛ هذه آخر بيانات محفوظة وقد تكون قديمة."
            : "تعذر جلب الطقس. أعد المحاولة عند توفر الاتصال."}
        </p>
      ) : null}
      {!data && !err ? <p className="text-sm text-muted">{t(lang, "loading")}</p> : null}
      {data ? (
        <>
          <Card className="p-5">
            <p className="text-xs text-muted">
              {coords ? "موقعك الحالي" : lang === "ar" ? city.ar : city.en}
            </p>
            <p className="mt-1 font-display text-5xl tabular-nums">
              {Math.round(data.current.temperature)}°
            </p>
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
                <div className="tabular-nums">
                  {Math.round(data.current.wind)} {lang === "ar" ? "كم/س" : "km/h"}
                </div>
              </div>
            </div>
          </Card>
          <h2 className="font-display text-xl">الساعات القادمة</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {data.hourly
              ?.filter((h) => h.time >= (data.localTime ?? new Date().toISOString().slice(0, 16)))
              .slice(0, 24)
              .map((h) => (
                <div
                  key={h.time}
                  className="min-w-24 shrink-0 rounded-xl border border-border p-3 text-center"
                >
                  <p>{h.time.slice(11, 16)}</p>
                  <p>{Math.round(h.temperature)}°</p>
                  <p className="text-xs">{weatherLabel(h.code, lang)}</p>
                </div>
              ))}
          </div>
          <h2 className="font-display text-xl">سبعة أيام</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {data.daily.map((d) => (
              <div key={d.date} className="rounded-lg border border-border bg-surface px-3 py-3">
                <div className="text-xs text-muted">
                  {new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", {
                    weekday: "short",
                  }).format(new Date(d.date + "T12:00:00"))}
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
