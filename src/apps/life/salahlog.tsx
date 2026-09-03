import { PRAYER_KEYS, PRAYER_LABELS, type PrayerKey } from "@/lib/prayer";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type DayLog = Partial<Record<PrayerKey, boolean>>;
type Store = Record<string, DayLog>;

const TRACK: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function streak(store: Store) {
  let n = 0;
  const d = new Date();
  for (let i = 0; i < 60; i++) {
    const key = d.toISOString().slice(0, 10);
    const log = store[key];
    const complete = TRACK.every((p) => log?.[p]);
    if (!complete) break;
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function SalahlogApp() {
  const lang = useAppStore((s) => s.lang);
  const [store, setStore] = usePersistent<Store>("waha:salahlog", {});
  const key = todayKey();
  const log = store[key] ?? {};
  const done = TRACK.filter((p) => log[p]).length;

  function toggle(p: PrayerKey) {
    setStore({ ...store, [key]: { ...log, [p]: !log[p] } });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {done}/5 · {lang === "ar" ? "سلسلة" : "Streak"} {streak(store)} {t(lang, "days")}
      </p>
      <div className="space-y-2">
        {TRACK.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => toggle(p)}
            className={cn(
              "flex h-14 w-full items-center justify-between rounded-xl border px-4 text-start",
              log[p] ? "border-primary bg-surface-2" : "border-border bg-surface",
            )}
          >
            <span className="font-medium">{PRAYER_LABELS[p][lang]}</span>
            <span className={cn("text-sm", log[p] ? "text-primary" : "text-muted")}>
              {log[p] ? (lang === "ar" ? "أُدّيت" : "Done") : lang === "ar" ? "لم تُسجل" : "Open"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
