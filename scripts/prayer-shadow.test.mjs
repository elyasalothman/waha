import assert from "node:assert/strict";
import test from "node:test";
import { CalculationMethod, Coordinates, PrayerTimes } from "adhan";

test("Umm al-Qura prayer times for Riyadh produce visible digits", () => {
  const coords = new Coordinates(24.7136, 46.6753);
  const date = new Date(2026, 8, 19, 12, 0, 0);
  const pt = new PrayerTimes(coords, date, CalculationMethod.UmmAlQura());
  const hm = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Riyadh",
    hour: "numeric",
    minute: "2-digit",
    numberingSystem: "latn",
  }).format(pt.maghrib);
  assert.match(hm, /\d/);
  assert.notEqual(hm, "—");
  assert.ok(pt.fajr.getTime() < pt.dhuhr.getTime());
});
