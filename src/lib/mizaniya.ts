/** ميزانيتي — local ledger math. Not advice, and not a market feed. */

export const MIZANIYA_KEY = "waha:mizaniya:v1";
export const CURRENCY = "SAR";

export const ACCOUNTS = [
  { id: "personal", ar: "شخصي", en: "Personal" },
  { id: "household", ar: "البيت", en: "Household" },
  { id: "side", ar: "عمل جانبي", en: "Side business" },
] as const;

export type AccountId = (typeof ACCOUNTS)[number]["id"];

export const CATEGORIES = [
  { id: "food", emoji: "🍞", ar: "طعام", en: "Food", budget: 1500 },
  { id: "transport", emoji: "🚌", ar: "مواصلات", en: "Transport", budget: 400 },
  { id: "home", emoji: "🏠", ar: "سكن", en: "Housing", budget: 2000 },
  { id: "health", emoji: "💊", ar: "صحة", en: "Health", budget: 300 },
  { id: "fun", emoji: "🎟️", ar: "ترفيه", en: "Leisure", budget: 300 },
  { id: "bills", emoji: "🧾", ar: "فواتير", en: "Bills", budget: 800 },
  { id: "other", emoji: "📦", ar: "أخرى", en: "Other", budget: 200 },
  { id: "income", emoji: "💼", ar: "دخل", en: "Income", budget: 0 },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export type Entry = {
  id: string;
  account: AccountId;
  kind: "income" | "expense";
  amount: number;
  categoryId: CategoryId;
  note: string;
  on: string;
  recurringId?: string;
};

export type Bill = {
  id: string;
  account: AccountId;
  title: string;
  amount: number;
  categoryId: CategoryId;
  day: number;
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
};

export type Ledger = {
  version: 1;
  entries: Entry[];
  bills: Bill[];
  goals: Goal[];
  budgets: Partial<Record<CategoryId, number>>;
};

export function emptyLedger(): Ledger {
  return { version: 1, entries: [], bills: [], goals: [], budgets: {} };
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function daysRemaining(date: Date): number {
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Math.max(0, last - date.getDate() + 1);
}

function money(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value < 1e12 ? Math.round(value * 100) / 100 : null;
}

function account(value: unknown): AccountId {
  return ACCOUNTS.some((item) => item.id === value) ? (value as AccountId) : "personal";
}

function category(value: unknown): CategoryId {
  return CATEGORIES.some((item) => item.id === value) ? (value as CategoryId) : "other";
}

function day(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function categoryBudget(ledger: Ledger, id: CategoryId): number {
  const custom = ledger.budgets[id];
  if (typeof custom === "number" && Number.isFinite(custom) && custom >= 0) return custom;
  return CATEGORIES.find((item) => item.id === id)?.budget ?? 0;
}

export function parseLedger(raw: string | null): Ledger {
  if (!raw) return emptyLedger();
  try {
    const data = JSON.parse(raw) as Partial<Ledger>;
    if (!data || data.version !== 1) return emptyLedger();
    const entries = Array.isArray(data.entries)
      ? data.entries.flatMap((item) => {
          const amount = money(item?.amount);
          const on = day(item?.on);
          if (!amount || !on || (item.kind !== "income" && item.kind !== "expense") || typeof item.id !== "string")
            return [];
          const entry: Entry = {
            id: item.id.slice(0, 80),
            account: account(item.account),
            kind: item.kind,
            amount,
            categoryId: category(item.categoryId),
            note: typeof item.note === "string" ? item.note.slice(0, 140) : "",
            on,
          };
          if (typeof item.recurringId === "string") entry.recurringId = item.recurringId.slice(0, 80);
          return [entry];
        })
      : [];
    const bills = Array.isArray(data.bills)
      ? data.bills.flatMap((item) => {
          const amount = money(item?.amount);
          const due = Math.floor(Number(item?.day));
          if (!amount || !Number.isFinite(due) || typeof item.id !== "string" || typeof item.title !== "string")
            return [];
          return [
            {
              id: item.id.slice(0, 80),
              account: account(item.account),
              title: item.title.trim().slice(0, 80),
              amount,
              categoryId: category(item.categoryId),
              day: Math.min(28, Math.max(1, due)),
            },
          ];
        })
      : [];
    const goals = Array.isArray(data.goals)
      ? data.goals.flatMap((item) => {
          const target = money(item?.target);
          const saved = typeof item?.saved === "number" && Number.isFinite(item.saved) && item.saved >= 0 ? item.saved : 0;
          if (!target || typeof item.id !== "string" || typeof item.name !== "string") return [];
          return [{ id: item.id.slice(0, 80), name: item.name.trim().slice(0, 80), target, saved: Math.min(target, saved) }];
        })
      : [];
    const budgets: Ledger["budgets"] = {};
    if (data.budgets && typeof data.budgets === "object") {
      for (const item of CATEGORIES) {
        const value = (data.budgets as Record<string, unknown>)[item.id];
        if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value < 1e12) budgets[item.id] = value;
      }
    }
    return { version: 1, entries, bills, goals, budgets };
  } catch {
    return emptyLedger();
  }
}

/** One posting per bill per month. Running it again does not duplicate. */
export function postBills(ledger: Ledger, month: string): Ledger {
  const additions: Entry[] = [];
  for (const bill of ledger.bills) {
    const on = `${month}-${String(bill.day).padStart(2, "0")}`;
    const id = `bill:${bill.id}:${month}`;
    if (ledger.entries.some((entry) => entry.id === id) || additions.some((entry) => entry.id === id)) continue;
    additions.push({
      id,
      account: bill.account,
      kind: "expense",
      amount: bill.amount,
      categoryId: bill.categoryId,
      note: bill.title,
      on,
      recurringId: bill.id,
    });
  }
  return additions.length ? { ...ledger, entries: [...additions, ...ledger.entries] } : ledger;
}

export function inAccount(entry: Entry, accountId: AccountId): boolean {
  return entry.account === accountId;
}

export function monthEntries(ledger: Ledger, accountId: AccountId, month: string): Entry[] {
  return ledger.entries.filter((entry) => entry.on.startsWith(month) && inAccount(entry, accountId));
}

export function monthTotals(entries: readonly Entry[]): { income: number; expense: number; net: number } {
  const income = entries.filter((entry) => entry.kind === "income").reduce((sum, entry) => sum + entry.amount, 0);
  const expense = entries.filter((entry) => entry.kind === "expense").reduce((sum, entry) => sum + entry.amount, 0);
  return { income, expense, net: Math.round((income - expense) * 100) / 100 };
}

export function spentInCategory(entries: readonly Entry[], categoryId: CategoryId): number {
  return entries
    .filter((entry) => entry.kind === "expense" && entry.categoryId === categoryId)
    .reduce((sum, entry) => sum + entry.amount, 0);
}

export function dailyNet(entries: readonly Entry[]): Record<string, number> {
  const nets: Record<string, number> = {};
  for (const entry of entries) {
    const signed = entry.kind === "income" ? entry.amount : -entry.amount;
    nets[entry.on] = Math.round(((nets[entry.on] ?? 0) + signed) * 100) / 100;
  }
  return nets;
}

export function sixMonthTrend(ledger: Ledger, accountId: AccountId, now: Date): { month: string; net: number }[] {
  const points: { month: string; net: number }[] = [];
  for (let back = 5; back >= 0; back--) {
    const date = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const month = monthKey(date);
    points.push({ month, net: monthTotals(monthEntries(ledger, accountId, month)).net });
  }
  return points;
}

export function topExpenseCategory(entries: readonly Entry[]): CategoryId | null {
  let best: CategoryId | null = null;
  let amount = 0;
  for (const category of CATEGORIES) {
    const spent = spentInCategory(entries, category.id);
    if (spent > amount) {
      amount = spent;
      best = category.id;
    }
  }
  return best;
}

export function toCsv(ledger: Ledger): string {
  const lines = ["التاريخ,الحساب,النوع,التصنيف,المبلغ,العملة,ملاحظة"];
  const cell = (value: string) => `"${value.replaceAll('"', '""')}"`;
  for (const entry of [...ledger.entries].sort((a, b) => a.on.localeCompare(b.on))) {
    const accountName = ACCOUNTS.find((item) => item.id === entry.account)?.ar ?? entry.account;
    const categoryName = CATEGORIES.find((item) => item.id === entry.categoryId)?.ar ?? entry.categoryId;
    lines.push(
      [entry.on, accountName, entry.kind === "income" ? "دخل" : "مصروف", categoryName, String(entry.amount), CURRENCY, entry.note]
        .map(cell)
        .join(","),
    );
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

/** Old monthly expense list, kept readable. Income is not invented. */
export function legacyExpenses(raw: string | null): Entry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as { month?: unknown; items?: unknown };
    if (typeof data.month !== "string" || !/^\d{4}-\d{2}$/.test(data.month) || !Array.isArray(data.items)) return [];
    return data.items.flatMap((item, index) => {
      if (!item || typeof item !== "object") return [];
      const row = item as { id?: unknown; title?: unknown; amount?: unknown };
      const amount = money(row.amount);
      if (!amount) return [];
      return [
        {
          id: typeof row.id === "string" ? `legacy:${row.id}` : `legacy:${data.month}:${index}`,
          account: "personal" as const,
          kind: "expense" as const,
          amount,
          categoryId: "other" as const,
          note: typeof row.title === "string" ? row.title.slice(0, 140) : "",
          on: `${data.month}-01`,
        },
      ];
    });
  } catch {
    return [];
  }
}
