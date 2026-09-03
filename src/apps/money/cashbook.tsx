import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Row = { id: string; title: string; amount: number; dir: "in" | "out"; date: string };
type Store = { opening: number; rows: Row[] };

export function CashbookApp() {
  const lang = useAppStore((s) => s.lang);
  const [store, setStore] = usePersistent<Store>("waha:cashbook", { opening: 0, rows: [] });
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dir, setDir] = useState<"in" | "out">("in");
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const balance = useMemo(() => {
    return store.rows.reduce((s, r) => s + (r.dir === "in" ? r.amount : -r.amount), store.opening);
  }, [store]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs text-muted">{L("رصيد الصندوق", "Cash on hand")}</p>
        <p className={cn("mt-1 font-display text-4xl tabular-nums", balance < 0 && "text-danger")}>{balance.toLocaleString()}</p>
      </div>
      <label className="block max-w-56 text-sm">
        <span className="mb-1 block text-muted">{L("افتتاحي", "Opening")}</span>
        <Input type="number" value={store.opening} onChange={(e) => setStore({ ...store, opening: Number(e.target.value) || 0 })} />
      </label>
      <form
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(amount);
          if (!title.trim() || !Number.isFinite(n) || n <= 0) return;
          setStore({
            ...store,
            rows: [{ id: crypto.randomUUID(), title: title.trim(), amount: n, dir, date: new Date().toISOString().slice(0, 10) }, ...store.rows],
          });
          setTitle("");
          setAmount("");
        }}
      >
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={L("البيان", "Memo")} />
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={L("المبلغ", "Amount")} />
        <select className="h-11 rounded-md border border-border bg-surface px-2 text-sm" value={dir} onChange={(e) => setDir(e.target.value as "in" | "out")}>
          <option value="in">{L("وارد", "In")}</option>
          <option value="out">{L("صادر", "Out")}</option>
        </select>
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      <ul className="space-y-2">
        {store.rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
            <div>
              <p className="font-medium">{r.title}</p>
              <p className="text-xs text-muted">{r.date}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn("font-mono tabular-nums", r.dir === "out" && "text-danger")}>
                {r.dir === "out" ? "−" : "+"}
                {r.amount.toLocaleString()}
              </span>
              <Button size="sm" variant="ghost" onClick={() => setStore({ ...store, rows: store.rows.filter((x) => x.id !== r.id) })}>
                {t(lang, "delete")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
