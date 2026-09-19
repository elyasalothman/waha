import { Input } from "@/components/ui/input";
import { Seg } from "@/components/seg";
import { usePersistent } from "@/lib/storage";
import { pairLang } from "@/lib/locale";
import { useAppStore } from "@/store/app-store";

type Mode = "add" | "extract" | "off";

function sar(n: number, lang: "ar" | "en") {
  return n.toLocaleString(lang === "ar" ? "ar-SA" : "en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function VatApp() {
  const lang = pairLang(useAppStore((s) => s.lang));
  const [amount, setAmount] = usePersistent("waha:vat-amount", 100);
  const [mode, setMode] = usePersistent<Mode>("waha:vat-mode", "add");
  const [off, setOff] = usePersistent("waha:vat-off", 20);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const vatRate = 0.15;

  let net = amount;
  let vat = 0;
  let gross = amount;
  let saved = 0;
  if (mode === "add") {
    vat = amount * vatRate;
    gross = amount + vat;
    net = amount;
  } else if (mode === "extract") {
    gross = amount;
    net = amount / (1 + vatRate);
    vat = gross - net;
  } else {
    saved = amount * (off / 100);
    gross = amount - saved;
  }

  return (
    <div className="space-y-4">
      <Seg
        lang={lang}
        value={mode}
        onChange={setMode}
        options={[
          { id: "add", ar: "أضف ١٥٪", en: "Add 15%" },
          { id: "extract", ar: "استخرج الضريبة", en: "Extract VAT" },
          { id: "off", ar: "خصم", en: "Discount" },
        ]}
      />
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{L("المبلغ", "Amount")}</span>
        <Input type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
      </label>
      {mode === "off" ? (
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("نسبة الخصم ٪", "Discount %")}</span>
          <Input type="number" min={0} max={100} value={off} onChange={(e) => setOff(Number(e.target.value) || 0)} />
        </label>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-3">
        {mode === "off" ? (
          <>
            <Tile label={L("الخصم", "You save")} value={sar(saved, lang)} />
            <Tile label={L("بعد الخصم", "After")} value={sar(gross, lang)} />
            <Tile label={L("ثم مع الضريبة", "Then +VAT")} value={sar(gross * 1.15, lang)} />
          </>
        ) : (
          <>
            <Tile label={L("بدون ضريبة", "Net")} value={sar(net, lang)} />
            <Tile label={L("الضريبة ١٥٪", "VAT 15%")} value={sar(vat, lang)} />
            <Tile label={L("الإجمالي", "Gross")} value={sar(gross, lang)} />
          </>
        )}
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-xl tabular-nums">{value}</p>
    </div>
  );
}
