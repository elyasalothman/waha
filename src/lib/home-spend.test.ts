import assert from "node:assert/strict";
import { test } from "node:test";
import { monthSpent } from "./home-spend.ts";

const now = new Date(2026, 9, 23, 12);

test("monthly spend totals positive numeric expenses and ignores malformed entries", () => {
  const raw = JSON.stringify({
    month: "2026-10",
    items: [
      { amount: 12.5 },
      { amount: 7.25 },
      { amount: 0 },
      { amount: -50 },
      { amount: "100" },
      { amount: null },
      {},
      null,
      [],
      "25",
    ],
  });
  assert.equal(monthSpent(raw, now), 19.75);
});

test("monthly spend ignores absent, malformed and structurally invalid saved budgets", () => {
  for (const raw of [
    null,
    "",
    "{broken",
    "null",
    "42",
    "[]",
    "{}",
    '{"month":"2026-10"}',
    '{"month":"2026-10","items":{}}',
  ])
    assert.equal(monthSpent(raw, now), 0, String(raw));
  assert.equal(monthSpent('{"month":"2026-10","items":[{"amount":1e400}]}', now), 0);
});

test("monthly spend uses the local calendar month and does not carry expenses across years", () => {
  const raw = JSON.stringify({ month: "2026-12", items: [{ amount: 25 }] });
  assert.equal(monthSpent(raw, new Date(2026, 11, 31, 23, 59, 59)), 25);
  assert.equal(monthSpent(raw, new Date(2027, 0, 1, 0, 0, 0)), 0);
  assert.equal(
    monthSpent(JSON.stringify({ month: "2027-01", items: [{ amount: 30 }] }), new Date(2027, 0, 1)),
    30,
  );
  assert.equal(monthSpent(JSON.stringify({ month: "2025-10", items: [{ amount: 40 }] }), now), 0);
});
