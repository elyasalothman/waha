import test from "node:test";
import assert from "node:assert/strict";
import { dailyMidad, steadyBooks, steadyResearch } from "./home-steady.ts";
import { DEFAULT_HOME_WIDGETS } from "./home-widgets.ts";

test("home picks stay in catalog order and skip the daily passage", () => {
  const now = Date.UTC(2026, 10, 7, 12);
  const today = dailyMidad(now);
  const picks = steadyBooks(now);
  assert.equal(picks.some((book) => book.id === today.id), false);
  assert.equal(picks.length, 3);
  assert.deepEqual(
    picks.map((book) => book.id),
    picks.map((book) => book.id),
  );
  const again = steadyBooks(now);
  assert.deepEqual(
    again.map((book) => book.id),
    picks.map((book) => book.id),
  );
  assert.equal(steadyResearch().some((item) => item.href.includes("/research/")), true);
  assert.equal(DEFAULT_HOME_WIDGETS.includes("reading"), true);
  assert.equal(
    (DEFAULT_HOME_WIDGETS as readonly string[]).includes("steady"),
    false,
  );
});
