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

test("after isha the remaining countdown is tonight-to-fajr, not two days", () => {
  const coords = new Coordinates(24.7136, 46.6753);
  const evening = new Date(Date.UTC(2026, 8, 19, 17, 20, 0)); // 8:20pm Riyadh
  const today = new PrayerTimes(coords, new Date(2026, 8, 19, 12, 0, 0), CalculationMethod.UmmAlQura());
  const tomorrow = new PrayerTimes(coords, new Date(2026, 8, 20, 12, 0, 0), CalculationMethod.UmmAlQura());
  assert.ok(evening.getTime() > today.isha.getTime());
  const remain = tomorrow.fajr.getTime() - evening.getTime();
  assert.ok(remain > 0);
  assert.ok(remain < 16 * 3600 * 1000, `expected under 16h, got ${remain / 3600000}h`);
});
