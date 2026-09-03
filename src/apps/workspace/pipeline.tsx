import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Stage = "lead" | "offer" | "won" | "lost";
type Deal = { id: string; title: string; client: string; amount: number; stage: Stage };

const STAGES: { id: Stage; ar: string; en: string }[] = [
  { id: "lead", ar: "فرصة", en: "Lead" },
  { id: "offer", ar: "عرض", en: "Offer" },
  { id: "won", ar: "مغلقة", en: "Won" },
  { id: "lost", ar: "ضائعة", en: "Lost" },
];

export function PipelineApp() {
  const lang = useAppStore((s) => s.lang);
  const [rows, setRows] = usePersistent<Deal[]>("waha:pipeline", []);
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("");
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const totals = useMemo(() => {
    const open = rows.filter((d) => d.stage === "lead" || d.stage === "offer").reduce((s, d) => s + d.amount, 0);
    const won = rows.filter((d) => d.stage === "won").reduce((s, d) => s + d.amount, 0);
    return { open, won };
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border bg-surface px-4 py-3">
          <p className="text-xs text-muted">{L("مفتوحة", "Open")}</p>
          <p className="mt-1 font-mono text-xl tabular-nums">{totals.open.toLocaleString(lang === "ar" ? "ar-SA" : "en-SA")}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-3">
          <p className="text-xs text-muted">{L("مغلقة", "Won")}</p>
          <p className="mt-1 font-mono text-xl tabular-nums">{totals.won.toLocaleString(lang === "ar" ? "ar-SA" : "en-SA")}</p>
        </div>
      </div>
      <form
        className="grid gap-2 sm:grid-cols-[1fr_8rem_7rem_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(amount);
          if (!title.trim() || !Number.isFinite(n)) return;
          setRows([{ id: crypto.randomUUID(), title: title.trim(), client: client.trim(), amount: n, stage: "lead" }, ...rows]);
          setTitle("");
          setClient("");
          setAmount("");
        }}
      >
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={L("الصفقة", "Deal")} />
        <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder={L("العميل", "Client")} />
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={L("المبلغ", "Amount")} />
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      <ul className="space-y-2">
        {rows.map((d) => (
          <li key={d.id} className="rounded-xl border border-border bg-surface px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{d.title}</p>
                <p className="text-sm text-muted">{d.client}</p>
                <p className="mt-1 font-mono tabular-nums">{d.amount.toLocaleString()} SAR</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setRows(rows.filter((x) => x.id !== d.id))}>
                {t(lang, "delete")}
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setRows(rows.map((x) => (x.id === d.id ? { ...x, stage: s.id } : x)))}
                  className={cn(
                    "h-9 rounded-md px-3 text-xs",
                    d.stage === s.id ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted",
                  )}
                >
                  {lang === "ar" ? s.ar : s.en}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
