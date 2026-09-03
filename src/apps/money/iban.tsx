import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkIban, formatIban } from "@/lib/iban-sa";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

export function IbanApp() {
  const lang = useAppStore((s) => s.lang);
  const [raw, setRaw] = usePersistent("waha:iban", "");
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const res = checkIban(raw);

  async function copy() {
    try {
      await navigator.clipboard.writeText(res.formatted.replace(/\s/g, ""));
      toast.success(t(lang, "copied"));
    } catch {
      toast.error(t(lang, "error"));
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{L("الآيبان", "IBAN")}</span>
        <Input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="SA00 0000 0000 0000 0000 0000"
          dir="ltr"
          className="font-mono"
        />
      </label>
      <div className={cn("rounded-xl border px-4 py-4", res.ok ? "border-success bg-surface" : "border-border bg-surface")}>
        <p className="font-mono text-lg tracking-wide" dir="ltr">
          {res.formatted || "SA•• •••• •••• •••• •••• ••••"}
        </p>
        <p className={cn("mt-2 text-sm", res.ok ? "text-success" : "text-muted")}>{lang === "ar" ? res.reasonAr : res.reasonEn}</p>
        {res.bank ? <p className="mt-1 text-sm text-muted">{lang === "ar" ? res.bank.ar : res.bank.en}</p> : null}
      </div>
      {res.formatted ? (
        <Button variant="secondary" onClick={copy}>
          {t(lang, "copy")}
        </Button>
      ) : null}
      <p className="text-xs text-subtle">{L("التحقق محلي على جهازك، لا يُرسل الرقم لأي خادم.", "Checked on this device — nothing is sent.")}</p>
    </div>
  );
}
