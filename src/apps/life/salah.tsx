import { useEffect, useMemo } from "react";
import { CitySelect } from "@/components/city-select";
import { Card } from "@/components/ui/card";
import { PrayerReminderToggle } from "@/components/prayer-reminder-toggle";
import { formatDuration, formatHm, getTimesInZone, nextPrayer, PRAYER_KEYS, PRAYER_LABELS, timesMap } from "@/lib/prayer";
import { markLiveFetch } from "@/lib/live-stamp";
import { useNow } from "@/hooks/use-now";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";
import { usePersistent } from "@/lib/storage";
import {
  buildSalahAlert,
  isNativeIos,
  SALAH_NOTIFY_KEY,
  syncSalahNotification,
} from "@/lib/native-salah-notifications";
import { cn } from "@/lib/cn";

export function SalahApp() {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const now = useNow(1000);
  const pt = useMemo(
    () => getTimesInZone(city.lat, city.lon, now, city.tz),
    [city.lat, city.lon, city.tz, now.toDateString()],
  );
  const map = timesMap(pt);
  const next = nextPrayer(pt, now, city.tz);
  const nextAt = next.at;
  const remain = nextAt.getTime() - now.getTime();
  const [notify, setNotify] = usePersistent(SALAH_NOTIFY_KEY, false);
  const native = isNativeIos();

  useEffect(() => {
    if (!native) return;
    const labels = PRAYER_LABELS[next.key];
    void syncSalahNotification(
      notify,
      buildSalahAlert({
        prayerAr: labels.ar,
        prayerEn: labels.en,
        lang,
        at: nextAt,
      }),
    );
  }, [native, notify, next.key, nextAt, lang]);

  useEffect(() => {
    markLiveFetch("prayer", Date.now(), typeof localStorage === "undefined" ? null : localStorage);
  }, [city.lat, city.lon, now.toDateString()]);

  return (
    <div className="space-y-4">
      <CitySelect />
      <PrayerReminderToggle lang={lang} />
      <Card className="p-5">
        <p className="text-xs text-muted">{t(lang, "nextPrayer")}</p>
        <p className="mt-1 font-display text-4xl">{PRAYER_LABELS[next.key][lang]}</p>
        <p className="mt-2 font-mono text-2xl tabular-nums tracking-tight text-primary">
          {formatHm(next.at, lang, city.tz)}
        </p>
        <p className="mt-1 text-sm text-muted">
          {t(lang, "remaining")} {formatDuration(remain, lang)}
        </p>
      </Card>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PRAYER_KEYS.map((key) => {
          const active = key === next.key;
          return (
            <div
              key={key}
              className={cn(
                "rounded-lg border px-3 py-3",
                active ? "border-primary bg-surface-2" : "border-border bg-surface",
              )}
            >
              <div className="text-xs text-muted">{PRAYER_LABELS[key][lang]}</div>
              <div className="mt-1 font-mono text-lg tabular-nums tracking-tight">{formatHm(map[key], lang, city.tz)}</div>
            </div>
          );
        })}
      </div>
      <Card className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="text-sm text-fg">
            {lang === "ar" ? "إشعار الصلاة القادمة" : "Next-prayer notification"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {native
              ? lang === "ar"
                ? "تنبيه أصلي على الجهاز — ليس إشعار المتصفح."
                : "A native device alert — not the browser notification API."
              : lang === "ar"
                ? "يتوفر في تطبيق آيفون (واحة). إضافة للشاشة الرئيسية لا توقظ بعد الإغلاق."
                : "Available in the iPhone app. Add-to-Home-Screen cannot wake after Safari is closed."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={notify}
          disabled={!native}
          onClick={() => setNotify(!notify)}
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full border transition-colors",
            notify && native ? "border-primary bg-primary" : "border-border bg-surface-2",
            !native && "opacity-50",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-fg transition-[inset-inline-start]",
              notify && native ? "start-6" : "start-0.5",
            )}
          />
        </button>
      </Card>
      <p className="text-xs text-subtle">
        {lang === "ar" ? "الحساب وفق أم القرى — مكة المكرمة." : "Calculated with the Umm al-Qura method."}
      </p>
    </div>
  );
}
