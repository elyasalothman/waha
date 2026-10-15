import { test } from "node:test";
import assert from "node:assert/strict";
import { dayPrefs, dayKey, moveCard, pillarCards, PILLARS } from "./personal-day.ts";
test("fixed pillars survive malformed preferences and attempts to hide core cards", () => {
  const p = dayPrefs({
    theme: "invalid",
    font: 900,
    hidden: ["prayer", "news", "hissati", "hayat", "unknown"],
    pinned: ["unknown", "hissati", "hissati"],
  });
  assert.deepEqual(
    PILLARS.map((p) => p.id),
    ["faith", "news", "fun", "learn"],
  );
  assert.deepEqual(p.hidden, ["hayat"]);
  assert.equal(p.font, 16);
  assert.equal(p.theme, "day");
  assert.deepEqual(p.pinned, ["hissati"]);
  assert.deepEqual(dayPrefs(null).order, []);
});
test("reordering is bounded within a pillar and pinned cards sort first", () => {
  let p = dayPrefs(null);
  p = moveCard(p, PILLARS[3].cards, "hissati", -1);
  assert.deepEqual(pillarCards(PILLARS[3].cards, p), ["reading", "hissati", "knowledge"]);
  assert.deepEqual(pillarCards(PILLARS[0].cards, p), ["prayer", "ayah", "athkar"]);
  assert.deepEqual(moveCard(p, PILLARS[3].cards, "news", -1), p);
  assert.deepEqual(pillarCards(PILLARS[3].cards, { ...p, pinned: ["hissati"] }), [
    "hissati",
    "reading",
    "knowledge",
  ]);
});
test("preferences are isolated per account and separate from guest", () => {
  assert.notEqual(dayKey("a"), dayKey("b"));
  assert.notEqual(dayKey("a"), dayKey());
  assert.equal(dayPrefs({ theme: "night", font: 20 }).theme, "night");
});
