import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  ACCOUNTS,
  CATEGORIES,
  CURRENCY,
  MIZANIYA_KEY,
  categoryBudget,
  dailyNet,
  daysRemaining,
  emptyLedger,
  legacyExpenses,
  monthEntries,
  monthKey,
  monthTotals,
  postBills,
  sixMonthTrend,
  spentInCategory,
  toCsv,
  topExpenseCategory,
  type AccountId,
  type CategoryId,
  type Ledger,
} from "@/lib/mizaniya";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

function todayStamp(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function money(value: number, lang: "ar" | "en") {
  return `${value.toLocaleString(lang === "ar" ? "ar-SA" : "en-SA")} ${CURRENCY}`;
}

export function BudgetApp() {
  const lang = useAppStore((s) => s.lang);
  const { user } = useCurrentUserState();
  const [ledger, setLedger] = usePersistent<Ledger>(MIZANIYA_KEY, emptyLedger());
  const [account, setAccount] = useState<AccountId>("personal");
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<CategoryId>("food");
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState(todayStamp());
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [billTitle, setBillTitle] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billDay, setBillDay] = useState("1");
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const now = new Date();
  const month = monthKey(now);
  const posted = useMemo(() => postBills(ledger.version === 1 ? ledger : emptyLedger(), month), [ledger, month]);
  const entries = monthEntries(posted, account, month);
  const totals = monthTotals(entries);
  const nets = dailyNet(entries);
  const trend = sixMonthTrend(posted, account, now);
  const top = topExpenseCategory(entries);
  const days = daysRemaining(now);
  const average = entries.length ? Math.round((totals.expense / Math.max(1, now.getDate())) * 100) / 100 : 0;
  const dayItems = entries.filter((entry) => entry.on === selected);
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const lead = (first.getDay() + 1) % 7;
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const signedIn = Boolean(user && !user.isDevFallback);

  function save(next: Ledger) {
    setLedger(next);
  }

  function addEntry() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    const imported = posted.entries.some((entry) => entry.id.startsWith("legacy:")) ? [] : legacyExpenses(localStorage.getItem("waha:budget"));
    save({
      ...posted,
      entries: [
        {
          id: crypto.randomUUID(),
          account,
          kind,
          amount: Math.round(value * 100) / 100,
          categoryId: kind === "income" ? "income" : categoryId,
          note: note.trim().slice(0, 140),
          on: todayStamp(),
        },
        ...imported,
        ...posted.entries,
      ],
    });
    setAmount("");
    setNote("");
  }

  function download() {
    const file = new Blob([toCsv(posted)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mizaniyati.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function wipe() {
    if (!window.confirm(L("حذف كل بيانات ميزانيتي من هذا الجهاز؟", "Delete all budget data on this device?"))) return;
    localStorage.removeItem("waha:budget");
    save(emptyLedger());
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5" dir={lang === "ar" ? "rtl" : "ltr"}>
      <header>
        <h1 className="font-display text-4xl">{L("ميزانيتي", "My budget")}</h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          {L(
            "تسجيل شخصي للدخل والمصروف. ليست نصيحة مالية، ولا توصية شراء أو بيع.",
            "A personal income and expense log. Not financial advice, and not a buy or sell recommendation.",
          )}
        </p>
        <p className="mt-1 text-sm leading-7 text-muted">
          {signedIn
            ? L(
                "أنت داخل الحساب، ودفتر الميزانية لا يُرفع إلى الخادم. يبقى على هذا الجهاز. لا قراءة للبنك ولا للرسائل.",
                "You are signed in, and this ledger is not uploaded. It stays on this device. No bank login and no SMS reading.",
              )
            : L(
                "البيانات على هذا الجهاز فقط، لأن الحساب غير متصل بدفتر سحابي. لا قراءة للبنك ولا للرسائل.",
                "The data stays on this device. There is no cloud ledger for the account. No bank login and no SMS reading.",
              )}
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        {ACCOUNTS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn("min-h-11 rounded-2xl border px-2 text-sm", account === item.id ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface")}
            onClick={() => setAccount(item.id)}
          >
            {lang === "ar" ? item.ar : item.en}
          </button>
        ))}
      </div>

      <form
        className="waha-card space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          addEntry();
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={cn("min-h-11 rounded-xl border", kind === "expense" ? "border-primary" : "border-border")} onClick={() => setKind("expense")}>
            {L("مصروف", "Expense")}
          </button>
          <button type="button" className={cn("min-h-11 rounded-xl border", kind === "income" ? "border-primary" : "border-border")} onClick={() => setKind("income")}>
            {L("دخل", "Income")}
          </button>
        </div>
        <Input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={L("المبلغ بالريال", "Amount in SAR")} aria-label={L("المبلغ", "Amount")} />
        {kind === "expense" ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.filter((item) => item.id !== "income").map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn("min-h-11 shrink-0 rounded-full border px-3 text-sm", categoryId === item.id ? "border-primary bg-surface-2" : "border-border")}
                onClick={() => setCategoryId(item.id)}
              >
                {item.emoji} {lang === "ar" ? item.ar : item.en}
              </button>
            ))}
          </div>
        ) : null}
        <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder={L("ملاحظة اختيارية", "Optional note")} aria-label={L("ملاحظة", "Note")} />
        <Button type="submit" className="min-h-11 w-full">{L("تسجيل", "Save")}</Button>
      </form>

      <section className="waha-card tint-sand" aria-label={L("رصيد الشهر", "Month balance")}>
        <p className="text-sm text-muted">{L("رصيد هذا الشهر", "This month's balance")}</p>
        <p className={cn("mt-1 font-display text-4xl tabular-nums", totals.net < 0 && "text-danger")}>{money(totals.net, lang)}</p>
        <p className="mt-2 text-sm text-muted">
          {L("دخل", "Income")} {money(totals.income, lang)} · {L("مصروف", "Spent")} {money(totals.expense, lang)} · {L("العملة", "Currency")} {CURRENCY}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2" aria-label={L("التصنيفات", "Categories")}>
        {CATEGORIES.filter((item) => item.id !== "income").map((item) => {
          const spent = spentInCategory(entries, item.id);
          const budget = categoryBudget(posted, item.id);
          const left = Math.round((budget - spent) * 100) / 100;
          return (
            <article key={item.id} className="waha-card">
              <h2 className="text-lg">{item.emoji} {lang === "ar" ? item.ar : item.en}</h2>
              <p className="mt-2 tabular-nums">{money(spent, lang)} / {money(budget, lang)}</p>
              <p className="text-sm text-muted">{L("المتبقي", "Left")} {money(left, lang)} · {L("أيام باقية", "Days left")} {days}</p>
            </article>
          );
        })}
      </section>

      <section className="waha-card" aria-label={L("تقويم الشهر", "Month calendar")}>
        <h2 className="text-lg">{L("صافي كل يوم", "Each day's net")}</h2>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
          {Array.from({ length: lead }, (_, index) => <span key={`pad-${index}`} />)}
          {Array.from({ length: last }, (_, index) => {
            const day = index + 1;
            const stamp = `${month}-${String(day).padStart(2, "0")}`;
            const net = nets[stamp];
            return (
              <button
                key={stamp}
                type="button"
                className={cn("min-h-11 rounded-xl border border-border", selected === stamp && "border-primary bg-surface-2")}
                onClick={() => setSelected(stamp)}
              >
                <span className="block">{day}</span>
                <span className="block text-[10px] text-muted">{net ? net : ""}</span>
              </button>
            );
          })}
        </div>
        <ul className="mt-3 space-y-2">
          {dayItems.length === 0 ? <li className="text-sm text-muted">{L("لا قيود في هذا اليوم.", "No entries on this day.")}</li> : null}
          {dayItems.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 text-sm">
              <span>{CATEGORIES.find((item) => item.id === entry.categoryId)?.emoji} {entry.note || (entry.kind === "income" ? L("دخل", "Income") : L("مصروف", "Expense"))}</span>
              <span className="tabular-nums">{entry.kind === "income" ? "+" : "−"}{money(entry.amount, lang)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="waha-card tint-sky" aria-label={L("إحصاءات", "Statistics")}>
        <h2 className="text-lg">{L("إحصاءات", "Statistics")}</h2>
        <p className="mt-2 text-sm">{L("الدخل مقابل المصروف", "Income versus expenses")}: {money(totals.income, lang)} / {money(totals.expense, lang)}</p>
        <p className="text-sm">{L("متوسط المصروف اليومي", "Average daily spend")}: {money(average, lang)}</p>
        <p className="text-sm">{L("أعلى تصنيف", "Top category")}: {top ? CATEGORIES.find((item) => item.id === top)?.emoji : L("لا يوجد", "None")}</p>
        <div className="mt-3 flex h-24 items-end gap-2" aria-label={L("اتجاه ستة أشهر", "Six-month trend")}>
          {trend.map((point) => {
            const max = Math.max(1, ...trend.map((item) => Math.abs(item.net)));
            const height = Math.max(4, Math.round((Math.abs(point.net) / max) * 80));
            return <div key={point.month} className="flex flex-1 flex-col items-center gap-1">
              <div className={cn("w-full rounded-t-md", point.net < 0 ? "bg-danger" : "bg-primary")} style={{ height }} />
              <span className="text-[10px] text-muted">{point.month.slice(5)}</span>
            </div>;
          })}
        </div>
      </section>

      <section className="waha-card tint-violet" aria-label={L("أهداف الادخار", "Savings goals")}>
        <h2 className="text-lg">{L("أهداف الادخار", "Savings goals")}</h2>
        <form className="mt-3 grid gap-2 sm:grid-cols-[1fr_8rem_auto]" onSubmit={(event) => {
          event.preventDefault();
          const target = Number(goalTarget);
          if (!goalName.trim() || !Number.isFinite(target) || target <= 0) return;
          save({ ...posted, goals: [...posted.goals, { id: crypto.randomUUID(), name: goalName.trim(), target, saved: 0 }] });
          setGoalName("");
          setGoalTarget("");
        }}>
          <Input value={goalName} onChange={(event) => setGoalName(event.target.value)} placeholder={L("اسم الهدف", "Goal name")} />
          <Input inputMode="decimal" value={goalTarget} onChange={(event) => setGoalTarget(event.target.value)} placeholder={CURRENCY} />
          <Button type="submit">{L("إضافة", "Add")}</Button>
        </form>
        {posted.goals.map((goal) => (
          <div key={goal.id} className="mt-3">
            <p>{goal.name} · {money(goal.saved, lang)} / {money(goal.target, lang)}</p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface">
              <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.round((goal.saved / goal.target) * 100))}%` }} />
            </div>
            <Button type="button" variant="ghost" className="mt-1" onClick={() => save({ ...posted, goals: posted.goals.map((item) => item.id === goal.id ? { ...item, saved: Math.min(item.target, item.saved + 50) } : item) })}>
              {L("أضف ٥٠ ريالاً محفوظاً", "Add 50 SAR saved")}
            </Button>
          </div>
        ))}
      </section>

      <section className="waha-card tint-rose" aria-label={L("فواتير متكررة", "Recurring bills")}>
        <h2 className="text-lg">{L("فواتير متكررة", "Recurring bills")}</h2>
        <form className="mt-3 grid gap-2 sm:grid-cols-[1fr_7rem_5rem_auto]" onSubmit={(event) => {
          event.preventDefault();
          const value = Number(billAmount);
          if (!billTitle.trim() || !Number.isFinite(value) || value <= 0) return;
          save({
            ...posted,
            bills: [...posted.bills, { id: crypto.randomUUID(), account, title: billTitle.trim(), amount: value, categoryId: "bills", day: Math.min(28, Math.max(1, Number(billDay) || 1)) }],
          });
          setBillTitle("");
          setBillAmount("");
        }}>
          <Input value={billTitle} onChange={(event) => setBillTitle(event.target.value)} placeholder={L("اسم الفاتورة", "Bill name")} />
          <Input inputMode="decimal" value={billAmount} onChange={(event) => setBillAmount(event.target.value)} placeholder={CURRENCY} />
          <Input inputMode="numeric" value={billDay} onChange={(event) => setBillDay(event.target.value)} aria-label={L("يوم الشهر", "Day of month")} />
          <Button type="submit">{L("تكرار", "Repeat")}</Button>
        </form>
        <ul className="mt-3 space-y-1 text-sm">
          {posted.bills.filter((bill) => bill.account === account).map((bill) => (
            <li key={bill.id}>{bill.title} · {money(bill.amount, lang)} · {L("يوم", "Day")} {bill.day}</li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={download}>{L("تصدير CSV", "Export CSV")}</Button>
        <Button type="button" variant="ghost" onClick={wipe}>{L("حذف كل البيانات", "Delete all data")}</Button>
      </div>
    </div>
  );
}
