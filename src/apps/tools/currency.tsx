import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

const CODES = ["SAR", "USD", "EUR", "GBP", "AED", "EGP", "KWD", "QAR", "BHD", "OMR", "TRY", "JPY"] as const;
const FALLBACK: Record<string, number> = {
  SAR: 1,
  USD: 0.267,
  EUR: 0.245,
  GBP: 0.21,
  AED: 0.98,
  EGP: 12.9,
  KWD: 0.082,
  QAR: 0.97,
  BHD: 0.1,
  OMR: 0.103,
  TRY: 8.7,
  JPY: 40,
};

export function CurrencyApp() {
  const lang = useAppStore((s) => s.lang);
  const [amount, setAmount] = useState(100);
  const [from, setFrom] = useState("SAR");
  const [to, setTo] = useState("USD");
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [approx, setApprox] = useState(false);

  useEffect(() => {
    fetch("https://api.frankfurter.app/latest?from=SAR")
      .then((r) => r.json())
      .then((d: { rates?: Record<string, number> }) => {
        const live: Record<string, number> = { SAR: 1, ...(d.rates ?? {}) };
        const merged = { ...FALLBACK, ...live };
        setRates(merged);
        setApprox(CODES.some((c) => live[c] == null));
      })
      .catch(() => {
        setRates(FALLBACK);
        setApprox(true);
      });
  }, []);

  const out = useMemo(() => {
    if (!rates) return 0;
    const a = rates[from];
    const b = rates[to];
    if (!a || !b) return 0;
    return (amount / a) * b;
  }, [rates, amount, from, to]);

  if (!rates) return <p className="text-sm text-muted">{t(lang, "loading")}</p>;

  return (
    <div className="space-y-4">
      {approx ? <p className="text-xs text-subtle">{lang === "ar" ? "بعض الأسعار تقريبية" : "Some rates are approximate"}</p> : null}
      <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
      <div className="grid grid-cols-2 gap-2">
        <select className="h-11 rounded-md border border-border bg-surface px-2" value={from} onChange={(e) => setFrom(e.target.value)}>
          {CODES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className="h-11 rounded-md border border-border bg-surface px-2" value={to} onChange={(e) => setTo(e.target.value)}>
          {CODES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <p className="font-mono text-3xl tabular-nums">
        {out.toLocaleString(lang === "ar" ? "ar-SA" : "en-SA", { maximumFractionDigits: 3 })} {to}
      </p>
    </div>
  );
}
