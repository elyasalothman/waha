import { hijriToGregorian, HIJRI_MONTHS, toHijri } from "@/lib/hijri";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Store = { days: string[] };

function iso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function FastingApp() {
  const lang = useAppStore((s) => s.lang);
  const [store, setStore] = usePersistent<Store>("waha:fasting", { days: [] });
  const now = new Date();
  const h = toHijri(now);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const cells: { hd: number; date: Date; iso: string; dow: number }[] = [];
  for (let hd = 1; hd <= 30; hd++) {
    const g = hijriToGregorian(h.hy, h.hm, hd);
    if (!g) continue;
    cells.push({ hd, date: g, iso: iso(g), dow: g.getDay() });
  }
  const marked = new Set(store.days);
  const thisMonth = cells.filter((c) => marked.has(c.iso)).length;
  const todayIso = iso(now);

  function toggle(key: string) {
    setStore({ days: marked.has(key) ? store.days.filter((x) => x !== key) : [...store.days, key] });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs text-muted">
          {HIJRI_MONTHS[lang][h.hm - 1]} {h.hy}
        </p>
        <p className="mt-1 font-display text-4xl tabular-nums">{thisMonth}</p>
        <p className="mt-1 text-sm text-muted">{L("أيام صمتها هذا الشهر", "Days fasted this month")}</p>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {(lang === "ar" ? ["ح", "ن", "ث", "ر", "خ", "ج", "س"] : ["S", "M", "T", "W", "T", "F", "S"]).map((d, i) => (
          <div key={i} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells[0]
          ? Array.from({ length: cells[0].dow }).map((_, i) => <div key={`pad-${i}`} />)
          : null}
        {cells.map((c) => {
          const on = marked.has(c.iso);
          const white = c.hd === 13 || c.hd === 14 || c.hd === 15;
          const ramadan = h.hm === 9;
          return (
            <button
              key={c.iso}
              type="button"
              onClick={() => toggle(c.iso)}
              className={cn(
                "flex h-12 flex-col items-center justify-center rounded-md border text-sm tabular-nums",
                on ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface",
                c.iso === todayIso && !on && "border-primary",
              )}
              title={white ? L("الأيام البيض", "White days") : ramadan ? L("رمضان", "Ramadan") : undefined}
            >
              {c.hd}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-subtle">{L("الأيام ١٣–١٥ أيام بيض. الاثنين والخميس سنة.", "Days 13–15 are the white days. Monday and Thursday are sunnah.")}</p>
    </div>
  );
}
