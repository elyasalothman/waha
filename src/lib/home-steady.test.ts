import test from "node:test";
import assert from "node:assert/strict";
import { dailyMidad, homeShelfPlan, libraryHref } from "./home-steady.ts";
import midad from "./books/platform/midad.json" with { type: "json" };

const now = Date.UTC(2026, 10, 7, 12);
const all = { continue: true, saved: true, reading: true, picks: true };

function store(rows: Record<string, unknown>) {
  const values = new Map(Object.entries(rows).map(([key, value]) => [key, JSON.stringify(value)]));
  return { getItem: (key: string) => values.get(key) ?? null };
}

test("picks stay in catalog order and skip the book already used for the passage", () => {
  const plan = homeShelfPlan(store({}), all, now);
  const again = homeShelfPlan(store({}), all, now);
  assert.equal(plan.daily?.id, dailyMidad(now).id);
  assert.deepEqual(
    again.picks.map((book) => book.id),
    plan.picks.map((book) => book.id),
  );
  assert.deepEqual(
    plan.picks.map((book) => book.id),
    midad
      .filter((book) => book.id !== plan.daily?.id)
      .slice(0, 3)
      .map((book) => book.id),
  );
});

test("a book in progress is not repeated as saved, daily, or a pick", () => {
  const book = midad.find((item) => item.chapterCount > 1);
  assert.ok(book);
  const href = libraryHref(book.id);
  const plan = homeShelfPlan(
    store({
      [`waha:reading:${book.id}`]: { chapter: 1, paragraph: 0, savedAt: "2026-11-07T12:00:00.000Z" },
      "waha:reading-shelf": [book.id],
    }),
    all,
    now,
  );
  assert.equal(plan.resume.filter((item) => item.href === href).length, 1);
  assert.equal(plan.saved.some((item) => item.href === href), false);
  assert.notEqual(plan.daily?.id, book.id);
  assert.equal(plan.picks.some((item) => item.id === book.id), false);
  const shown = [
    ...plan.resume.map((item) => item.href),
    ...plan.saved.map((item) => item.href),
    plan.daily ? libraryHref(plan.daily.id) : "",
    ...plan.picks.map((item) => libraryHref(item.id)),
  ].filter(Boolean);
  assert.equal(new Set(shown).size, shown.length);
});

test("hiding continue lets the dated book stay on the daily card", () => {
  const today = dailyMidad(now);
  const row = { [`waha:reading:${today.id}`]: { chapter: 1, savedAt: "2026-11-07T12:00:00.000Z" } };
  const hidden = homeShelfPlan(
    store(row),
    { continue: false, saved: false, reading: true, picks: true },
    now,
  );
  assert.deepEqual(hidden.resume, []);
  assert.equal(hidden.daily?.id, today.id);
  assert.equal(hidden.picks.some((book) => book.id === today.id), false);
  if (today.chapterCount > 1) {
    const shown = homeShelfPlan(store(row), all, now);
    assert.notEqual(shown.daily?.id, today.id);
  }
});

test("an empty widget selection reserves nothing", () => {
  const plan = homeShelfPlan(
    store({}),
    { continue: false, saved: false, reading: false, picks: false },
    now,
  );
  assert.deepEqual(plan.resume, []);
  assert.deepEqual(plan.saved, []);
  assert.equal(plan.daily, null);
  assert.deepEqual(plan.picks, []);
});
