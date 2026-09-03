import { Button } from "@/components/ui/button";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Store = { round: number; juz: number[] };

export function KhatmaApp() {
  const lang = useAppStore((s) => s.lang);
  const [store, setStore] = usePersistent<Store>("waha:khatma", { round: 1, juz: [] });
  const n = store.juz.length;
  const pct = Math.round((n / 30) * 100);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  function toggle(j: number) {
    const has = store.juz.includes(j);
    const juz = has ? store.juz.filter((x) => x !== j) : [...store.juz, j].sort((a, b) => a - b);
    setStore({ ...store, juz });
  }

  function complete() {
    setStore({ round: store.round + 1, juz: [] });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs text-muted">{L(`الختمة رقم ${store.round}`, `Khatma #${store.round}`)}</p>
        <p className="mt-1 font-display text-4xl tabular-nums">{n}/30</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
        {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => {
          const on = store.juz.includes(j);
          return (
            <button
              key={j}
              type="button"
              onClick={() => toggle(j)}
              className={cn(
                "flex h-12 items-center justify-center rounded-lg border font-mono text-sm tabular-nums",
                on ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface text-fg",
              )}
            >
              {j}
            </button>
          );
        })}
      </div>
      <Button disabled={n < 30} onClick={complete}>
        {L("أتممت الختمة — ابدأ التالية", "Khatma complete — start the next")}
      </Button>
    </div>
  );
}
