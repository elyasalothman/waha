import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Exp = { id: string; title: string; amount: number; cat: string; date: string; paid: boolean };

const CATS_AR = ["مواصلات", "ضيافة", "أدوات", "سفر", "أخرى"];
const CATS_EN = ["Transport", "Hosting", "Tools", "Travel", "Other"];

function monthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function ExpensesApp() {
  const lang = useAppStore((s) => s.lang);
  const cats = lang === "ar" ? CATS_AR : CATS_EN;
  const [rows, setRows] = usePersistent<Exp[]>("waha:expenses", []);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState(cats[0]!);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const month = monthKey();
  const monthRows = rows.filter((r) => r.date.startsWith(month));
  const due = useMemo(() => monthRows.filter((r) => !r.paid).reduce((s, r) => s + r.amount, 0), [monthRows]);
  const done = useMemo(() => monthRows.filter((r) => r.paid).reduce((s, r) => s + r.amount, 0), [monthRows]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border bg-surface px-4 py-3">
          <p className="text-xs text-muted">{L("بانتظار التعويض", "Awaiting payout")}</p>
          <p className="mt-1 font-mono text-xl tabular-nums">{due.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-3">
          <p className="text-xs text-muted">{L("عُوّض هذا الشهر", "Repaid this month")}</p>
          <p className="mt-1 font-mono text-xl tabular-nums">{done.toLocaleString()}</p>
        </div>
      </div>
      <form
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(amount);
          if (!title.trim() || !Number.isFinite(n) || n <= 0) return;
          setRows([{ id: crypto.randomUUID(), title: title.trim(), amount: n, cat, date: new Date().toISOString().slice(0, 10), paid: false }, ...rows]);
          setTitle("");
          setAmount("");
        }}
      >
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={L("المصروف", "Expense")} />
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={L("المبلغ", "Amount")} />
        <select className="h-11 rounded-md border border-border bg-surface px-2 text-sm" value={cat} onChange={(e) => setCat(e.target.value)}>
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      <ul className="space-y-2">
        {monthRows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
            <button type="button" className="text-start" onClick={() => setRows(rows.map((x) => (x.id === r.id ? { ...x, paid: !x.paid } : x)))}>
              <p className={cn("font-medium", r.paid && "text-muted line-through")}>{r.title}</p>
              <p className="text-xs text-muted">{r.cat}</p>
            </button>
            <div className="flex items-center gap-3">
              <span className="font-mono tabular-nums">{r.amount.toLocaleString()}</span>
              <Button size="sm" variant="ghost" onClick={() => setRows(rows.filter((x) => x.id !== r.id))}>
                {t(lang, "delete")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
