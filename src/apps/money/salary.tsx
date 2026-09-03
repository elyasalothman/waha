import { type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Form = { basic: number; housing: number; transport: number; other: number; saudi: boolean };

const empty: Form = { basic: 8000, housing: 2000, transport: 800, other: 0, saudi: true };
const GOSI_RATE = 0.0975;
const GOSI_CAP = 45000;

export function SalaryApp() {
  const lang = useAppStore((s) => s.lang);
  const [v, setV] = usePersistent<Form>("waha:salary", empty);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const gross = v.basic + v.housing + v.transport + v.other;
  const wage = Math.min(GOSI_CAP, Math.max(0, v.basic + v.housing));
  const gosi = v.saudi ? wage * GOSI_RATE : 0;
  const net = gross - gosi;
  const loc = lang === "ar" ? "ar-SA" : "en-SA";

  function bind(key: Exclude<keyof Form, "saudi">) {
    return {
      type: "number" as const,
      value: v[key],
      onChange: (e: ChangeEvent<HTMLInputElement>) => setV({ ...v, [key]: Number(e.target.value) || 0 }),
    };
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs text-muted">{L("الصافي الشهري", "Monthly net")}</p>
        <p className="mt-1 font-display text-4xl tabular-nums">
          {net.toLocaleString(loc, { maximumFractionDigits: 0 })}
          <span className="ms-2 text-lg text-muted">SAR</span>
        </p>
        <p className="mt-2 text-sm text-muted">
          {L("التأمينات", "GOSI")} {gosi.toLocaleString(loc, { maximumFractionDigits: 0 })} · {L("الإجمالي", "Gross")}{" "}
          {gross.toLocaleString(loc, { maximumFractionDigits: 0 })}
        </p>
      </div>
      <div className="grid gap-1 rounded-lg border border-border bg-surface p-1 sm:grid-cols-2">
        <button
          type="button"
          className={cn("h-11 rounded-md text-sm", v.saudi ? "bg-surface-2" : "text-muted")}
          onClick={() => setV({ ...v, saudi: true })}
        >
          {L("مواطن — ٩٫٧٥٪", "Saudi — 9.75%")}
        </button>
        <button
          type="button"
          className={cn("h-11 rounded-md text-sm", !v.saudi ? "bg-surface-2" : "text-muted")}
          onClick={() => setV({ ...v, saudi: false })}
        >
          {L("مقيم — بدون خصم موظف", "Resident — no employee share")}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("الأساسي", "Basic")}</span>
          <Input {...bind("basic")} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("بدل السكن", "Housing")}</span>
          <Input {...bind("housing")} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("بدل النقل", "Transport")}</span>
          <Input {...bind("transport")} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("بدلات أخرى", "Other")}</span>
          <Input {...bind("other")} />
        </label>
      </div>
      <p className="text-xs text-subtle">
        {L(
          "حصة الموظف في التأمينات ٩٪ تقاعد + ٠٫٧٥٪ ساند على الأجر الخاضع (أساسي+سكن) بحد ٤٥ ألف. إرشادي وليس بيان راتب رسمي.",
          "Employee GOSI is 9% pension + 0.75% SANED on contributory wage (basic+housing), capped at 45k. A guide, not an official payslip.",
        )}
      </p>
    </div>
  );
}
