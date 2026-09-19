import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatHmInZone, formatLocalHm, isVisibleHm } from "./clock.ts";
import { DEFAULT_CITY } from "./cities.ts";
import { climateFallbackC, formatCelsius, fetchWeatherSafe } from "./weather.ts";
import { formatHijri, toHijri } from "./hijri.ts";
import { formatHm, nextPrayerVisible } from "./prayer.ts";
import { fetchHomeNews } from "./news.ts";
import { shadowDayNow } from "./shadow-day.ts";

const ARABIC_INDIC = /[٠-٩]/;

describe("formatLocalHm", () => {
  it("always returns visible ASCII HH:MM", () => {
    assert.equal(formatLocalHm(new Date(2026, 0, 1, 9, 5, 0)), "09:05");
    assert.equal(formatLocalHm(new Date(2026, 0, 1, 0, 0, 0)), "00:00");
    assert.equal(formatLocalHm(new Date(2026, 0, 1, 23, 59, 0)), "23:59");
    assert.ok(isVisibleHm(formatLocalHm(new Date("invalid"))));
    assert.ok(!ARABIC_INDIC.test(formatLocalHm(new Date())));
  });
});

describe("next prayer Umm al-Qura Riyadh", () => {
  it("exposes HH:MM that never blanks", () => {
    const noon = new Date(Date.UTC(2026, 8, 19, 9, 0, 0));
    const next = nextPrayerVisible(DEFAULT_CITY.lat, DEFAULT_CITY.lon, noon, DEFAULT_CITY.tz);
    assert.ok(next.key);
    assert.ok(next.label.ar.length > 0);
    assert.ok(isVisibleHm(next.hm));
    assert.ok(!ARABIC_INDIC.test(next.hm));
    assert.ok(isVisibleHm(formatHm(next.at, "ar", DEFAULT_CITY.tz)));
    assert.ok(isVisibleHm(formatHmInZone(next.at, DEFAULT_CITY.tz)));
  });
});

describe("hijri", () => {
  it("never returns an empty date string", () => {
    const s = formatHijri(new Date(2026, 8, 19), "ar");
    assert.ok(s.trim().length > 3);
    assert.notEqual(s, "—");
    const h = toHijri(new Date(2026, 8, 19));
    assert.ok(h.hy > 1400);
    assert.ok(h.hm >= 1 && h.hm <= 12);
    assert.ok(h.hd >= 1 && h.hd <= 30);
  });
});

describe("shadowDayNow", () => {
  it("fills clock, prayer HH:MM, weather °C, and hijri instantly", () => {
    const snap = shadowDayNow(new Date(Date.UTC(2026, 8, 19, 12, 0, 0)), DEFAULT_CITY);
    assert.ok(isVisibleHm(snap.clock));
    assert.ok(isVisibleHm(snap.prayerHm));
    assert.match(snap.weatherText, /^-?\d+°C$/);
    assert.ok(Number.isFinite(snap.weatherC));
    assert.ok(snap.prayerLabelAr.length > 0);
    assert.ok(snap.hijri.trim().length > 0);
    assert.notEqual(snap.clock, "—");
    assert.notEqual(snap.prayerHm, "—");
    assert.notEqual(snap.weatherText, "—");
    assert.notEqual(snap.hijri, "—");
    assert.ok(!ARABIC_INDIC.test(snap.clock));
    assert.ok(!ARABIC_INDIC.test(snap.prayerHm));
    assert.ok(!ARABIC_INDIC.test(snap.weatherText));
  });
});

describe("weather °C", () => {
  it("formatCelsius always shows a number and unit", () => {
    assert.equal(formatCelsius(36.4), "36°C");
    assert.match(formatCelsius(Number.NaN), /^-?\d+°C$/);
    assert.ok(Number.isFinite(climateFallbackC(8)));
  });

  it("fetchWeatherSafe resolves a number within 2s even if the network fails", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error("offline");
    };
    try {
      const started = Date.now();
      const result = await fetchWeatherSafe(24.7136, 46.6753, 200);
      assert.ok(Date.now() - started < 2000);
      assert.ok(Number.isFinite(result.celsius));
      assert.match(formatCelsius(result.celsius), /^-?\d+°C$/);
      assert.notEqual(formatCelsius(result.celsius), "—");
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe("news isolation", () => {
  it("returns [] when the feed fails — never throws", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error("news down");
    };
    try {
      const items = await fetchHomeNews(100);
      assert.deepEqual(items, []);
    } finally {
      globalThis.fetch = original;
    }
  });
});
