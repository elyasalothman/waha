import type { ChangeEvent } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

type Form = { km: number; kpl: number; p91: number; p95: number };

export function FuelApp() {
  const lang = useAppStore((s) => s.lang);
  const [v, setV] = usePersistent<Form>("waha:fuel", { km: 400, kpl: 12, p91: 2.18, p95: 2.33 });
  const liters = v.kpl > 0 ? v.km / v.kpl : 0;
  const c91 = liters * v.p91;
  const c95 = liters * v.p95;
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  function bind(key: keyof Form) {
    return {
      type: "number" as const,
      min: 0,
      step: "0.01",
      value: v[key],
      onChange: (e: ChangeEvent<HTMLInputElement>) => setV({ ...v, [key]: Number(e.target.value) }),
    };
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-muted">{L("المسافة (كم)", "Distance (km)")}</span>
          <Input {...bind("km")} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">{L("الكفاءة (كم/لتر)", "Efficiency (km/L)")}</span>
          <Input {...bind("kpl")} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">{L("سعر ٩١", "91 price")}</span>
          <Input {...bind("p91")} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">{L("سعر ٩٥", "95 price")}</span>
          <Input {...bind("p95")} />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-4">
          <div className="text-xs text-muted">{L("اللترات", "Liters")}</div>
          <div className="mt-1 font-mono text-2xl tabular-nums">{liters.toFixed(1)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted">{L("تكلفة ٩١", "Cost 91")}</div>
          <div className="mt-1 font-mono text-2xl tabular-nums">{c91.toFixed(1)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted">{L("تكلفة ٩٥", "Cost 95")}</div>
          <div className="mt-1 font-mono text-2xl tabular-nums">{c95.toFixed(1)}</div>
        </Card>
      </div>
    </div>
  );
}
