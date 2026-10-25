import test from "node:test";
import assert from "node:assert/strict";
import { createLocalStore, parseArabicTime, sanitizeFeedback } from "./local.ts";
const now = new Date(2026, 9, 25, 10, 0, 0);
for (const [text, hours] of [
  ["بعد ساعتين", 2],
  ["بعد ٣ ساعات", 3],
  ["بعد ساعة", 1],
  ["بعد دقيقتين", 2 / 60],
  ["بعد يومين", 48],
] as const)
  test(text, () =>
    assert.equal(Date.parse(parseArabicTime(text, now)!.dueAt) - now.getTime(), hours * 3600000),
  );
test("tomorrow afternoon local time", () => {
  const d = new Date(parseArabicTime("بكرة ٥ العصر", now)!.dueAt);
  assert.equal(d.getDate(), 26);
  assert.equal(d.getHours(), 17);
});
test("night and upcoming weekday", () => {
  assert.equal(new Date(parseArabicTime("الساعة ٩ الليل", now)!.dueAt).getHours(), 21);
  assert.equal(new Date(parseArabicTime("يوم الخميس", now)!.dueAt).getDay(), 4);
});
test("invalid and absent times", () => {
  assert.equal(parseArabicTime("الساعة ٢٩", now), null);
  assert.equal(parseArabicTime("اشرب موية", now), null);
});
test("feedback masks phone email long digits", () => {
  const text = sanitizeFeedback("  راسل A@EXAMPLE.COM ٠٥٥١٢٣٤٥٦٧ رقم 1234567890123 ");
  assert.ok(!text.includes("055"));
  assert.ok(!text.includes("@"));
  assert.ok(!text.includes("123456789"));
});
function memory() {
  const data = new Map<string, string>();
  return createLocalStore({
    getItem: (k) => data.get(k) || null,
    setItem: (k, v) => {
      data.set(k, v);
    },
  });
}
test("notes memory deletion and local city", () => {
  const s = memory();
  const n = s.add("notes", "اختبار");
  assert.equal(s.list("notes").length, 1);
  assert.equal(s.remove("notes", n.id)?.text, "اختبار");
  s.add("memories", "مدينتي جدة");
  assert.equal(s.city(), "جدة");
  s.clear("memories");
  assert.equal(s.city(), undefined);
});
test("feedback bounded 200 and opt in disabled", () => {
  const s = memory();
  assert.equal(s.improveEnabled(), false);
  for (let i = 0; i < 230; i++) s.addFeedback(`سؤال ${i}`, false, true);
  assert.equal(s.feedback().length, 200);
  s.setImproveEnabled(true);
  assert.equal(s.improveEnabled(), true);
  assert.match(s.issueUrl(), /^https:\/\/github.com\/elyasalothman\/waha\/issues\/new/);
});
test("corrupted storage recovers", () => {
  const s = createLocalStore({ getItem: () => "{bad", setItem: () => {} });
  assert.deepEqual(s.list("memories"), []);
});
