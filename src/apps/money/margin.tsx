import { Input } from "@/components/ui/input";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

type Form = { cost: number; price: number; target: number };

export function MarginApp() {
  const lang = useAppStore((s) => s.lang);
  const [v, setV] = usePersistent<Form>("waha:margin", { cost: 80, price: 100, target: 20 });
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const profit = v.price - v.cost;
  const margin = v.price > 0 ? (profit / v.price) * 100 : 0;
  const markup = v.cost > 0 ? (profit / v.cost) * 100 : 0;
  const suggested = v.target >= 100 ? 0 : v.cost / (1 - v.target / 100);
  const nf = (n: number) => n.toLocaleString(lang === "ar" ? "ar-SA" : "en-SA", { maximumFractionDigits: 2 });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("التكلفة", "Cost")}</span>
          <Input type="number" value={v.cost} onChange={(e) => setV({ ...v, cost: Number(e.target.value) || 0 })} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("سعر البيع", "Sell price")}</span>
          <Input type="number" value={v.price} onChange={(e) => setV({ ...v, price: Number(e.target.value) || 0 })} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("هامش مستهدف ٪", "Target margin %")}</span>
          <Input type="number" value={v.target} onChange={(e) => setV({ ...v, target: Number(e.target.value) || 0 })} />
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Stat label={L("الربح", "Profit")} value={`${nf(profit)} SAR`} />
        <Stat label={L("الهامش", "Margin")} value={`${nf(margin)}%`} />
        <Stat label={L("العلامة", "Markup")} value={`${nf(markup)}%`} />
      </div>
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs text-muted">{L("سعر البيع ليبلغ الهامش المستهدف", "Price to hit the target margin")}</p>
        <p className="mt-2 font-display text-3xl tabular-nums">{nf(suggested)}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-lg tabular-nums">{value}</p>
    </div>
  );
}
