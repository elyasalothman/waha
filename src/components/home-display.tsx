import { useEffect, useState } from "react";
import { useSettings } from "@/store/settings-store";
import { useAppStore } from "@/store/app-store";
import { getTimesInZone, PRAYER_KEYS, PRAYER_LABELS } from "@/lib/prayer";

/** Next prayer as text. Uses the saved city; it does not ask for device location. */
export function DisplayPrayer() {
  const settings = useSettings((s) => s.settings);
  const city = useAppStore((s) => s.city);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, []);
  let line = "تُحسب المواقيت من المدينة المحفوظة.";
  if (now) {
    try {
      const times = getTimesInZone(city.lat, city.lon, now, city.tz);
      const key = PRAYER_KEYS.find((item) => item !== "sunrise" && times[item] > now);
      const at = key
        ? times[key]
        : getTimesInZone(city.lat, city.lon, new Date(now.getTime() + 86400000), city.tz).fajr;
      const label = PRAYER_LABELS[key || "fajr"][settings.language];
      line = `${label} · ${new Intl.DateTimeFormat(settings.language === "ar" ? "ar-SA" : "en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        numberingSystem: settings.digits,
        timeZone: city.tz,
      }).format(at)}`;
    } catch {
      line = "تعذّر حساب المواقيت لهذه المدينة.";
    }
  }
  return (
    <section
      aria-label="الصلاة القادمة"
      data-home-widget="prayer"
      className="rounded-2xl border border-border bg-surface p-4"
    >
      <h2 className="text-lg">الصلاة القادمة</h2>
      <p className="mt-2 text-sm text-muted">{city[settings.language]} · أم القرى</p>
      <p className="mt-2 text-xl">{line}</p>
    </section>
  );
}

/** Hijri and civil date for the saved city. Text only. */
export function DisplayDate() {
  const settings = useSettings((s) => s.settings);
  const city = useAppStore((s) => s.city);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);
  const locale = settings.language === "ar" ? "ar-SA" : "en-GB";
  const format = (calendar: "islamic-umalqura" | "gregory") =>
    now
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "full",
          calendar,
          numberingSystem: settings.digits,
          timeZone: city.tz,
        }).format(now)
      : "…";
  return (
    <section
      aria-label="تاريخ اليوم"
      data-home-widget="hijri"
      className="rounded-2xl border border-border bg-surface p-4"
    >
      <h2 className="text-lg">تاريخ اليوم</h2>
      <p className="mt-2 leading-7">{format("islamic-umalqura")}</p>
      <p className="text-sm leading-7 text-muted">{format("gregory")}</p>
    </section>
  );
}
