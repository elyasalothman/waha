import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { fetchGold, type GoldQuote } from "@/lib/gold";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export function GoldApp() {
  const lang = useAppStore((s) => s.lang);
  const [q, setQ] = useState<GoldQuote | null>(null);
  const [grams, setGrams] = useState(10);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  useEffect(() => {
    let live = true;
    fetchGold()
      .then((g) => live && setQ(g))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (!q) return <p className="text-sm text-muted">{t(lang, "loading")}</p>;

  const loc = lang === "ar" ? "ar-SA" : "en-SA";
  const money = (n: number) => n.toLocaleString(loc, { maximumFractionDigits: 2 });

  return (
    <div className="space-y-4">
      {q.approx ? <p className="text-xs text-subtle">{L("الأسعار تقريبية إذا تعذّر المصدر الحي", "Prices are approximate if the live feed is down")}</p> : null}
      <div className="grid grid-cols-3 gap-2">
        {[
          { k: "24k", v: q.sarG24 },
          { k: "21k", v: q.sarG21 },
          { k: "18k", v: q.sarG18 },
        ].map((row) => (
          <div key={row.k} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-muted">{row.k}</p>
            <p className="mt-1 font-display text-xl tabular-nums whitespace-nowrap">{money(row.v)}</p>
            <p className="text-xs text-subtle">{L("ريال / غرام", "SAR / g")}</p>
          </div>
        ))}
      </div>
      <label className="block max-w-56 text-sm">
        <span className="mb-1 block text-muted">{L("كم غراماً؟", "How many grams?")}</span>
        <Input type="number" min={0} value={grams} onChange={(e) => setGrams(Number(e.target.value) || 0)} />
      </label>
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          { k: L("عيار ٢٤", "24k"), v: q.sarG24 * grams },
          { k: L("عيار ٢١", "21k"), v: q.sarG21 * grams },
          { k: L("عيار ١٨", "18k"), v: q.sarG18 * grams },
        ].map((row) => (
          <div key={row.k} className="rounded-lg border border-border bg-surface px-3 py-2">
            <div className="text-xs text-muted">{row.k}</div>
            <div className="font-mono tabular-nums">{money(row.v)} SAR</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-subtle">
        {L(`الأونصة ${money(q.usdOz)} دولار · الدولار ${q.usdSar.toFixed(3)} ريال`, `Ounce ${money(q.usdOz)} USD · USD ${q.usdSar.toFixed(3)} SAR`)}
      </p>
    </div>
  );
}
