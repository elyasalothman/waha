import { useMemo, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

type Form = { amount: number; months: number; rate: number };

export function InstallmentApp() {
  const lang = useAppStore((s) => s.lang);
  const [v, setV] = usePersistent<Form>("waha:install", { amount: 50000, months: 24, rate: 0 });
  const monthly = useMemo(() => {
    const n = v.months;
    const r = v.rate / 100 / 12;
    if (n <= 0) return 0;
    if (r === 0) return v.amount / n;
    return (v.amount * r * (1 + r) ** n) / ((1 + r) ** n - 1);
  }, [v]);
  const total = monthly * v.months;
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
        <p className="text-xs text-muted">{L("القسط الشهري", "Monthly payment")}</p>
        <p className="mt-1 font-display text-4xl tabular-nums">
          {monthly.toLocaleString(lang === "ar" ? "ar-SA" : "en-SA", { maximumFractionDigits: 2 })}
          <span className="ms-2 text-lg text-muted">SAR</span>
        </p>
        <p className="mt-2 text-sm text-muted">
          {L("الإجمالي", "Total")} {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{L("المبلغ", "Amount")}</span>
        <Input {...bind("amount")} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{L("المدة بالأشهر", "Months")}</span>
        <Input {...bind("months")} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{L("نسبة سنوية % (اختياري)", "Annual rate % (optional)")}</span>
        <Input {...bind("rate")} />
      </label>
    </div>
  );
}
