import test from "node:test";
import assert from "node:assert/strict";
import {
  daysRemaining,
  dailyNet,
  legacyExpenses,
  monthTotals,
  parseLedger,
  postBills,
  sixMonthTrend,
  spentInCategory,
  toCsv,
  topExpenseCategory,
  type Ledger,
} from "./mizaniya.ts";

const now = new Date(2026, 10, 18);

function ledger(): Ledger {
  return {
    version: 1,
    budgets: { food: 100 },
    goals: [{ id: "g", name: "عمرة", target: 1000, saved: 250 }],
    bills: [{ id: "rent", account: "household", title: "إيجار", amount: 2000, categoryId: "home", day: 1 }],
    entries: [
      { id: "a", account: "personal", kind: "income", amount: 5000, categoryId: "income", note: "راتب", on: "2026-11-01" },
      { id: "b", account: "personal", kind: "expense", amount: 80, categoryId: "food", note: "خبز", on: "2026-11-02" },
      { id: "c", account: "personal", kind: "expense", amount: 40, categoryId: "transport", note: "", on: "2026-11-02" },
      { id: "d", account: "side", kind: "expense", amount: 900, categoryId: "other", note: "ليس هذا الحساب", on: "2026-11-03" },
    ],
  };
}

test("a month balances income against expenses and ignores other accounts", () => {
  const totals = monthTotals(ledger().entries.filter((entry) => entry.account === "personal" && entry.on.startsWith("2026-11")));
  assert.equal(totals.income, 5000);
  assert.equal(totals.expense, 120);
  assert.equal(totals.net, 4880);
  assert.equal(spentInCategory(ledger().entries.filter((entry) => entry.account === "personal"), "food"), 80);
  assert.equal(daysRemaining(now), 13);
});

test("a day net is income minus expenses, and the top category is the largest expense", () => {
  const nets = dailyNet(ledger().entries.filter((entry) => entry.account === "personal"));
  assert.equal(nets["2026-11-02"], -120);
  assert.equal(nets["2026-11-01"], 5000);
  assert.equal(topExpenseCategory(ledger().entries), "other");
});

test("a recurring bill posts once for the month", () => {
  const once = postBills(ledger(), "2026-11");
  const twice = postBills(once, "2026-11");
  const rent = twice.entries.filter((entry) => entry.recurringId === "rent");
  assert.equal(rent.length, 1);
  assert.equal(rent[0]?.on, "2026-11-01");
  assert.equal(rent[0]?.note, "إيجار");
});

test("six months stay in order and the csv keeps Arabic with a byte order mark", () => {
  const trend = sixMonthTrend(ledger(), "personal", now);
  assert.deepEqual(
    trend.map((point) => point.month),
    ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"],
  );
  assert.equal(trend.at(-1)?.net, 4880);
  const csv = toCsv(ledger());
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.match(csv, /راتب/);
  assert.match(csv, /SAR/);
  assert.doesNotMatch(csv, /شراء|بيع/);
});

test("damaged rows are dropped and an old expense list stays an expense", () => {
  assert.equal(parseLedger("{").entries.length, 0);
  assert.equal(parseLedger(JSON.stringify({ version: 1, entries: [{ id: "x", kind: "expense", amount: -5 }] })).entries.length, 0);
  const old = legacyExpenses(JSON.stringify({ month: "2026-11", items: [{ id: "1", title: "قهوة", amount: 12 }] }));
  assert.equal(old[0]?.kind, "expense");
  assert.equal(old[0]?.note, "قهوة");
  assert.equal(old[0]?.on, "2026-11-01");
});
