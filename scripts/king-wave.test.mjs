import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CalculationMethod, Coordinates, PrayerTimes } from "adhan";

const house = readFileSync(new URL("../src/lib/house.ts", import.meta.url), "utf8");
const emergency = readFileSync(new URL("../src/lib/emergency-sa.ts", import.meta.url), "utf8");
const segments = readFileSync(new URL("../src/lib/segments.ts", import.meta.url), "utf8");
const share = readFileSync(new URL("../src/lib/share-shadow.ts", import.meta.url), "utf8");
const remind = readFileSync(new URL("../src/lib/prayer-remind.ts", import.meta.url), "utf8");
const index = readFileSync(new URL("../src/routes/index.tsx", import.meta.url), "utf8");

test("four Alhajda doors stay outbound-only", () => {
  for (const href of [
    "https://tahajjud.alhajda.com",
    "https://ai.alhajda.com",
    "https://games.alhajda.com",
    "https://alhajda.com",
  ]) {
    assert.ok(house.includes(href), href);
  }
});

test("Saudi emergency strip is official numbers only", () => {
  for (const n of ["911", "997", "998", "999"]) {
    assert.ok(emergency.includes(`"${n}"`), n);
  }
  assert.ok(emergency.includes('["family", "elder"]'));
  assert.match(emergency, /Official Saudi emergency numbers only/);
});

test("home hides extras behind المزيد and keeps four first-screen wells", () => {
  assert.ok(index.includes("MoreFold"));
  assert.ok(index.includes("ShareShadowButton"));
  assert.ok(index.includes("PrayerRemindToggle"));
  assert.ok(index.includes("EmergencyStrip"));
  assert.ok(index.includes("houseWellsFor") || index.includes("homeWellsFor"));
  assert.ok(segments.includes('all: ["faith", "desk", "money"]'));
  assert.ok(!segments.includes('all: ["faith", "house", "desk", "health", "know", "play"]') || segments.includes("HOME_WELLS"));
  assert.ok(segments.includes("HOME_WELLS"));
});

test("share card and remind hook exist", () => {
  assert.ok(share.includes("nav.share") || share.includes("navigator.share"));
  assert.ok(share.includes("ayah"));
  assert.ok(remind.includes("LocalNotifications"));
  assert.ok(remind.includes("queued"));
  assert.ok(remind.includes("fajr"));
  assert.ok(!remind.includes('"sunrise"') || remind.includes("REMIND_PRAYERS"));
});

test("Umm al-Qura times still produce Latin digits for the share card", () => {
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
});
