import { useMemo, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

type Form = {
  cash: number;
  goldG: number;
  silverG: number;
  stocks: number;
  debts: number;
  goldPrice: number;
  silverPrice: number;
  basis: "gold" | "silver";
};

const empty: Form = {
  cash: 0,
  goldG: 0,
  silverG: 0,
  stocks: 0,
  debts: 0,
  goldPrice: 280,
  silverPrice: 3.4,
  basis: "gold",
};

export function ZakatApp() {
  const lang = useAppStore((s) => s.lang);
  const [form, setForm] = usePersistent<Form>("waha:zakat", empty);
  const [v, setV] = useState(form);

  const result = useMemo(() => {
    const goldVal = v.goldG * v.goldPrice;
    const silverVal = v.silverG * v.silverPrice;
    const wealth = Math.max(0, v.cash + goldVal + silverVal + v.stocks - v.debts);
    const nisab = v.basis === "gold" ? 85 * v.goldPrice : 595 * v.silverPrice;
    const due = wealth >= nisab ? wealth * 0.025 : 0;
    return { wealth, nisab, due, eligible: wealth >= nisab };
  }, [v]);

  function num(key: keyof Form) {
    return (
      <Input
        type="number"
        min={0}
        step="0.01"
        value={Number.isFinite(v[key] as number) ? (v[key] as number) : 0}
        onChange={(e) => {
          const next = { ...v, [key]: Number(e.target.value) };
          setV(next);
          setForm(next);
        }}
      />
    );
  }

  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="font-display text-4xl tabular-nums text-primary">
          {result.due.toLocaleString(lang === "ar" ? "ar-SA" : "en-SA", { maximumFractionDigits: 2 })}{" "}
          <span className="text-lg text-muted">SAR</span>
        </p>
        <p className="mt-2 text-sm text-muted">
          {result.eligible
            ? L("بلغت النصاب — الزكاة واجبة بنسبة ٢٫٥٪", "Nisab reached — zakat is 2.5%")
            : L("لم يبلغ النصاب بعد", "Below nisab — no zakat due")}
        </p>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={L("النقد وما في حكمه", "Cash and equivalents")}>{num("cash")}</Field>
        <Field label={L("أسهم واستثمارات", "Stocks and investments")}>{num("stocks")}</Field>
        <Field label={L("ذهب (غرام)", "Gold (grams)")}>{num("goldG")}</Field>
        <Field label={L("سعر غرام الذهب", "Gold price / g")}>{num("goldPrice")}</Field>
        <Field label={L("فضة (غرام)", "Silver (grams)")}>{num("silverG")}</Field>
        <Field label={L("سعر غرام الفضة", "Silver price / g")}>{num("silverPrice")}</Field>
        <Field label={L("ديون حالة", "Immediate debts")}>{num("debts")}</Field>
        <Field label={L("نصاب الحساب", "Nisab basis")}>
          <select
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
            value={v.basis}
            onChange={(e) => {
              const next = { ...v, basis: e.target.value as Form["basis"] };
              setV(next);
              setForm(next);
            }}
          >
            <option value="gold">{L("ذهب ٨٥ غراماً", "Gold 85 g")}</option>
            <option value="silver">{L("فضة ٥٩٥ غراماً", "Silver 595 g")}</option>
          </select>
        </Field>
      </div>
      <p className="text-xs text-subtle">
        {L(
          "حاسبة إرشادية وليست فتوى. يُرجع لأهل العلم في الحالات الخاصة.",
          "A guide, not a fatwa. Consult a qualified scholar for edge cases.",
        )}
      </p>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg border border-border bg-surface px-3 py-2">
          <div className="text-xs text-muted">{L("المال الزكوي", "Zakatable wealth")}</div>
          <div className="tabular-nums">{result.wealth.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border border-border bg-surface px-3 py-2">
          <div className="text-xs text-muted">{L("النصاب", "Nisab")}</div>
          <div className="tabular-nums">{result.nisab.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      {children}
    </label>
  );
}
