import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pairLang, t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Bill = { id: string; title: string; amount: number; dueDay: number; paidOn: string | null };
type Sub = { id: string; title: string; amount: number; cycle: "month" | "year" };
type Store = { bills: Bill[]; subs: Sub[] };

function monthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function sar(n: number, lang: "ar" | "en") {
  return `${n.toLocaleString(lang === "ar" ? "ar-SA" : "en-SA")} SAR`;
}

export function BillsApp() {
  const lang = pairLang(useAppStore((s) => s.lang));
  const [store, setStore] = usePersistent<Store>("waha:bills", { bills: [], subs: [] });
  const [tab, setTab] = useState<"bills" | "subs">("bills");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [cycle, setCycle] = useState<"month" | "year">("month");
  const month = monthKey();
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const unpaid = store.bills.filter((b) => b.paidOn !== month);
  const monthlySubs = store.subs.reduce((s, x) => s + (x.cycle === "year" ? x.amount / 12 : x.amount), 0);
  const billSum = unpaid.reduce((s, b) => s + b.amount, 0);

  function addBill() {
    const n = Number(amount);
    const day = Math.min(28, Math.max(1, Number(dueDay) || 1));
    if (!title.trim() || !Number.isFinite(n) || n <= 0) return;
    setStore({ ...store, bills: [{ id: crypto.randomUUID(), title: title.trim(), amount: n, dueDay: day, paidOn: null }, ...store.bills] });
    setTitle("");
    setAmount("");
  }

  function addSub() {
    const n = Number(amount);
    if (!title.trim() || !Number.isFinite(n) || n <= 0) return;
    setStore({ ...store, subs: [{ id: crypto.randomUUID(), title: title.trim(), amount: n, cycle }, ...store.subs] });
    setTitle("");
    setAmount("");
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">{L("فواتير غير مسددة", "Unpaid bills")}</p>
          <p className="mt-1 font-display text-2xl tabular-nums">{sar(billSum, lang)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">{L("اشتراكات / شهر", "Subs / month")}</p>
          <p className="mt-1 font-display text-2xl tabular-nums">{sar(Math.round(monthlySubs), lang)}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface p-1">
        <button type="button" className={cn("h-10 rounded-md text-sm", tab === "bills" ? "bg-surface-2" : "text-muted")} onClick={() => setTab("bills")}>
          {L("فواتير", "Bills")}
        </button>
        <button type="button" className={cn("h-10 rounded-md text-sm", tab === "subs" ? "bg-surface-2" : "text-muted")} onClick={() => setTab("subs")}>
          {L("اشتراكات", "Subscriptions")}
        </button>
      </div>
      <form
        className="grid gap-2 sm:grid-cols-[1fr_7rem_7rem_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (tab === "bills") addBill();
          else addSub();
        }}
      >
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tab === "bills" ? L("الكهرباء، الإيجار…", "Power, rent…") : L("نتفليكس، جوال…", "Netflix, mobile…")} />
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={L("المبلغ", "Amount")} />
        {tab === "bills" ? (
          <Input type="number" min={1} max={28} value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder={L("يوم الاستحقاق", "Due day")} />
        ) : (
          <select className="h-11 rounded-md border border-border bg-surface px-2 text-sm" value={cycle} onChange={(e) => setCycle(e.target.value as "month" | "year")}>
            <option value="month">{L("شهري", "Monthly")}</option>
            <option value="year">{L("سنوي", "Yearly")}</option>
          </select>
        )}
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      {tab === "bills" ? (
        <ul className="space-y-2">
          {store.bills.map((b) => {
            const paid = b.paidOn === month;
            return (
              <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                <div>
                  <p className="font-medium">{b.title}</p>
                  <p className="text-xs text-muted">
                    {sar(b.amount, lang)} · {L(`يوم ${b.dueDay}`, `Day ${b.dueDay}`)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={paid ? "secondary" : "default"}
                    onClick={() =>
                      setStore({
                        ...store,
                        bills: store.bills.map((x) => (x.id === b.id ? { ...x, paidOn: paid ? null : month } : x)),
                      })
                    }
                  >
                    {paid ? L("مسدد", "Paid") : L("سدّدت", "Mark paid")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setStore({ ...store, bills: store.bills.filter((x) => x.id !== b.id) })}>
                    {t(lang, "delete")}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="space-y-2">
          {store.subs.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-muted">
                  {sar(s.amount, lang)} · {s.cycle === "year" ? L("سنوي", "Yearly") : L("شهري", "Monthly")}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setStore({ ...store, subs: store.subs.filter((x) => x.id !== s.id) })}>
                {t(lang, "delete")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
