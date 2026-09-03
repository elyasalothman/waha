import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tafqeetInteger, tafqeetMoney } from "@/lib/tafqeet";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

export function TafqeetApp() {
  const lang = useAppStore((s) => s.lang);
  const [n, setN] = usePersistent("waha:tafqeet", 1250.5);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const words = tafqeetMoney(n);
  const raw = tafqeetInteger(Math.floor(Math.abs(n)));

  async function copy() {
    try {
      await navigator.clipboard.writeText(`فقط ${words} لا غير`);
      toast.success(t(lang, "copied"));
    } catch {
      toast.error(t(lang, "error"));
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{L("المبلغ بالريال", "Amount in riyals")}</span>
        <Input type="number" step={0.01} value={n} onChange={(e) => setN(Number(e.target.value) || 0)} />
      </label>
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs text-muted">{L("تفقيط", "In words")}</p>
        <p className="mt-3 font-display text-3xl leading-snug">فقط {words} لا غير</p>
        <p className="mt-3 text-sm text-muted">{raw}</p>
      </div>
      <Button onClick={copy}>{t(lang, "copy")}</Button>
    </div>
  );
}
