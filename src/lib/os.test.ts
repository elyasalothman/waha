import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { defaultFeatures, normalizeFeatures } from "./features.ts";
import { KING_LOCK, assertKingLock, composePersonalHome, firstScreenIds, OS_APPS } from "./os.ts";
import { isHttpUrl, SISTER_APPS } from "./links.ts";
import { normalizeInbox, seedFamilyInbox, unreadCount } from "./messages.ts";
import { parseWeather } from "./weather.ts";

describe("King lock — first screen", () => {
  it("is one prayer hero, at most four wells, games off the first screen", () => {
    const surface = composePersonalHome(defaultFeatures());
    const lock = assertKingLock(surface);
    assert.equal(surface.hero, "prayer");
    assert.equal(lock.oneHero, true);
    assert.ok(surface.wells.length <= KING_LOCK.maxPrimaryWells);
    assert.ok(surface.primary.length <= KING_LOCK.maxPrimaryWells);
    assert.equal(lock.gamesOffFirstScreen, true);
    assert.equal(
      firstScreenIds(surface).some((id) => id.includes("game") || id.includes("play")),
      false,
    );
  });

  it("hides disabled dock apps", () => {
    const flags = normalizeFeatures({ weather: false, messages: false });
    const surface = composePersonalHome(flags);
    assert.equal(
      surface.primary.some((a) => a.id === "weather"),
      false,
    );
    assert.equal(
      surface.wells.some((w) => w.id === "inbox"),
      false,
    );
  });

  it("keeps water and expense as secondary wells when money is on", () => {
    const surface = composePersonalHome(defaultFeatures());
    assert.deepEqual(
      surface.wells.map((w) => w.id).slice(0, 2),
      ["water", "expense"],
    );
  });

  it("lists the OS dock in the required Arabic set", () => {
    assert.deepEqual(
      OS_APPS.map((a) => a.title.ar),
      ["طقس", "إيمان", "رسائل", "مال", "اسأل", "إعدادات"],
    );
  });
});

describe("sister apps", () => {
  it("opens only the five Alhajda surfaces", () => {
    assert.deepEqual(
      SISTER_APPS.map((a) => a.href),
      [
        "https://tahajjud.alhajda.com",
        "https://ai.alhajda.com",
        "https://games.alhajda.com",
        "https://hayat.alhajda.com",
        "https://alhajda.com",
      ],
    );
    for (const app of SISTER_APPS) assert.equal(isHttpUrl(app.href), true);
    assert.equal(isHttpUrl("javascript:alert(1)"), false);
  });
});

describe("family inbox", () => {
  it("seeds a local family thread and counts unread honestly", () => {
    const inbox = seedFamilyInbox(100);
    assert.equal(inbox.threads[0]?.title, "العائلة");
    assert.ok(inbox.messages[0]?.body.includes("المزامنة"));
    assert.equal(unreadCount(inbox, 0), 1);
    assert.equal(unreadCount(inbox, 200), 0);
    const recovered = normalizeInbox({ threads: [], messages: [] });
    assert.ok(recovered.threads.length >= 1);
  });
});

describe("weather parse", () => {
  it("keeps current, hourly, and daily for a city", () => {
    const payload = parseWeather(
      {
        current: {
          temperature_2m: 36.4,
          apparent_temperature: 35,
          relative_humidity_2m: 12,
          wind_speed_10m: 14,
          weather_code: 0,
        },
        hourly: {
          time: ["2099-01-01T16:00", "2099-01-01T17:00"],
          temperature_2m: [36, 37],
          weather_code: [0, 1],
          relative_humidity_2m: [12, 11],
          precipitation_probability: [0, 0],
        },
        daily: {
          time: ["2099-01-01"],
          weather_code: [0],
          temperature_2m_max: [38],
          temperature_2m_min: [24],
        },
        timezone: "Asia/Riyadh",
        utc_offset_seconds: 10800,
      },
      Date.parse("2099-01-01T11:00:00Z"),
    );
    assert.equal(Math.round(payload.current.temperature), 36);
    assert.equal(payload.hourly.length, 2);
    assert.equal(payload.timezone, "Asia/Riyadh");
    assert.equal(payload.daily[0]?.max, 38);
  });
});
