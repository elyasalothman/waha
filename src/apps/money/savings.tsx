import { useMemo, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

type Form = { goal: number; saved: number; monthly: number };

export function SavingsApp() {
  const lang = useAppStore((s) => s.lang);
  const [v, setV] = usePersistent<Form>("waha:savings", { goal: 20000, saved: 2500, monthly: 1000 });
  const left = Math.max(0, v.goal - v.saved);
  const months = useMemo(() => {
    if (v.monthly <= 0) return null;
    return Math.ceil(left / v.monthly);
  }, [left, v.monthly]);
  const pct = v.goal > 0 ? Math.min(100, Math.round((v.saved / v.goal) * 100)) : 0;
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  function bind(key: keyof Form) {
    return {
      type: "number" as const,
      value: v[key],
      onChange: (e: ChangeEvent<HTMLInputElement>) => setV({ ...v, [key]: Number(e.target.value) || 0 }),
    };
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="font-display text-4xl tabular-nums">{pct}%</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-3 text-sm text-muted">
          {months == null
            ? L("حدّد ادخاراً شهرياً", "Set a monthly amount")
            : months <= 0
              ? L("بلغت الهدف", "Goal reached")
              : L(`تصل خلال ${months} شهراً`, `${months} months to go`)}
        </p>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{L("الهدف", "Goal")}</span>
        <Input {...bind("goal")} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{L("المدّخر الآن", "Saved so far")}</span>
        <Input {...bind("saved")} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{L("ادخار كل شهر", "Each month")}</span>
        <Input {...bind("monthly")} />
      </label>
      <p className="font-mono text-sm tabular-nums text-muted">
        {L("المتبقي", "Remaining")} {left.toLocaleString()} SAR
      </p>
    </div>
  );
}
