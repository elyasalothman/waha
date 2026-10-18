import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

const CODES = [
  "SAR",
  "USD",
  "EUR",
  "GBP",
  "AED",
  "EGP",
  "KWD",
  "QAR",
  "BHD",
  "OMR",
  "TRY",
  "JPY",
] as const;

export function CurrencyApp() {
  const lang = useAppStore((s) => s.lang);
  const [amount, setAmount] = useState(100);
  const [from, setFrom] = useState("SAR");
  const [to, setTo] = useState("USD");
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [failed, setFailed] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    fetch("/api/rates", { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d: { rates?: Record<string, number>; updatedAt?: string }) => {
        if (
          !d.rates ||
          CODES.some((code) => !Number.isFinite(d.rates?.[code]) || d.rates![code] <= 0)
        )
          throw new Error();
        setRates(d.rates);
        setUpdatedAt(d.updatedAt || "");
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [attempt]);

  const out = useMemo(() => {
    if (!rates) return 0;
    const a = rates[from];
    const b = rates[to];
    if (!a || !b) return 0;
    return Number.isFinite(amount) ? (amount / a) * b : 0;
  }, [rates, amount, from, to]);

  if (failed)
    return (
      <div role="status" className="space-y-3">
        <p>{lang === "ar" ? "تعذّر تحديث أسعار العملات." : "Exchange rates are unavailable."}</p>
        <button
          className="min-h-11 rounded-xl border border-border px-4"
          onClick={() => setAttempt((n) => n + 1)}
        >
          {lang === "ar" ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    );
  if (!rates) return <p className="text-sm text-muted">{t(lang, "loading")}</p>;

  return (
    <div className="space-y-4">
      <p className="break-words text-xs text-muted">ExchangeRate-API · {updatedAt}</p>
      <Input
        aria-label={lang === "ar" ? "المبلغ" : "Amount"}
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          aria-label={lang === "ar" ? "من عملة" : "From currency"}
          className="h-11 rounded-md border border-border bg-surface px-2"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        >
          {CODES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label={lang === "ar" ? "إلى عملة" : "To currency"}
          className="h-11 rounded-md border border-border bg-surface px-2"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        >
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
