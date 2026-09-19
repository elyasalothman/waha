import { useMemo } from "react";
import { CitySelect } from "@/components/city-select";
import { Card } from "@/components/ui/card";
import { formatDuration, formatHm, getTimes, nextPrayer, PRAYER_KEYS, prayerLabel, timesMap } from "@/lib/prayer";
import { useNow } from "@/hooks/use-now";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

export function SalahApp() {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const now = useNow(1000);
  const tz = city.tz || "Asia/Riyadh";
  const pt = useMemo(() => getTimes(city.lat, city.lon, now, tz), [city.lat, city.lon, tz, now.toDateString()]);
  const map = timesMap(pt);
  const next = nextPrayer(pt, now, tz);
  const remain = next.at.getTime() - now.getTime();

  return (
    <div className="space-y-4">
      <CitySelect />
      <Card className="p-5">
        <p className="text-xs text-muted">{t(lang, "nextPrayer")}</p>
        <p className="mt-1 font-display text-4xl">{prayerLabel(next.key, lang)}</p>
        <p className="num mt-2 font-mono text-2xl tabular-nums text-primary">{formatHm(next.at, lang, tz)}</p>
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
              <div className="text-xs text-muted">{prayerLabel(key, lang)}</div>
              <div className="num mt-1 font-mono text-lg tabular-nums">{formatHm(map[key], lang, tz)}</div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-subtle">
        {lang === "ar" ? "الحساب وفق أم القرى — مكة المكرمة." : "Calculated with the Umm al-Qura method."}
      </p>
    </div>
  );
}
