import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Item = { id: string; title: string; amount: number; cat: string };
type Store = { month: string; limit: number; items: Item[] };

const CATS_AR = ["طعام", "مواصلات", "بيت", "صحة", "ترفيه", "أخرى"];
const CATS_EN = ["Food", "Transport", "Home", "Health", "Leisure", "Other"];

function monthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function BudgetApp() {
  const lang = useAppStore((s) => s.lang);
  const cats = lang === "ar" ? CATS_AR : CATS_EN;
  const [store, setStore] = usePersistent<Store>("waha:budget", { month: monthKey(), limit: 4000, items: [] });
  const month = monthKey();
  const items = store.month === month ? store.items : [];
  const limit = store.limit;
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState(cats[0]!);
  const spent = useMemo(() => items.reduce((s, i) => s + i.amount, 0), [items]);
  const left = limit - spent;
  const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

  function commit(next: Partial<Store>) {
    setStore({ month, limit, items, ...next });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs text-muted">{lang === "ar" ? "المتبقي هذا الشهر" : "Left this month"}</p>
        <p className={cn("mt-1 font-display text-4xl tabular-nums", left < 0 && "text-danger")}>
          {left.toLocaleString(lang === "ar" ? "ar-SA" : "en-SA")}
          <span className="ms-2 text-lg text-muted">SAR</span>
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted">
          {spent.toLocaleString()} / {limit.toLocaleString()} · {pct}%
        </p>
      </div>
      <label className="block max-w-56 text-sm">
        <span className="mb-1 block text-muted">{lang === "ar" ? "حد الشهر" : "Monthly cap"}</span>
        <Input type="number" value={limit} onChange={(e) => commit({ limit: Number(e.target.value) || 0 })} />
      </label>
      <form
        className="grid gap-2 sm:grid-cols-[1fr_7rem_8rem_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(amount);
          if (!title.trim() || !Number.isFinite(n) || n <= 0) return;
          commit({ items: [{ id: crypto.randomUUID(), title: title.trim(), amount: n, cat }, ...items] });
          setTitle("");
          setAmount("");
        }}
      >
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={lang === "ar" ? "المصروف" : "Expense"} />
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={lang === "ar" ? "المبلغ" : "Amount"} />
        <select className="h-11 rounded-md border border-border bg-surface px-2 text-sm" value={cat} onChange={(e) => setCat(e.target.value)}>
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2">
            <div>
              <p className="text-sm">{item.title}</p>
              <p className="text-xs text-muted">{item.cat}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono tabular-nums">{item.amount.toLocaleString()}</span>
              <Button size="sm" variant="ghost" onClick={() => commit({ items: items.filter((x) => x.id !== item.id) })}>
                {t(lang, "delete")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
