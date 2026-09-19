import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSalahAlert, requestSalahNotificationPermission, SALAH_NOTIFICATION_ID } from "./native-salah-notifications.ts";

describe("buildSalahAlert", () => {
  it("uses Arabic copy for the native salah notification", () => {
    const at = new Date("2026-09-19T15:30:00Z");
    const alert = buildSalahAlert({
      prayerAr: "العصر",
      prayerEn: "Asr",
      lang: "ar",
      at,
    });
    assert.equal(alert.id, SALAH_NOTIFICATION_ID);
    assert.equal(alert.title, "واحة");
    assert.equal(alert.body, "حان وقت صلاة العصر");
    assert.equal(alert.at.toISOString(), at.toISOString());
  });

  it("uses English copy when the shell is LTR", () => {
    const alert = buildSalahAlert({
      prayerAr: "الفجر",
      prayerEn: "Fajr",
      lang: "en",
      at: new Date("2026-09-20T03:00:00Z"),
    });
    assert.equal(alert.title, "Waha");
    assert.equal(alert.body, "Time for Fajr");
  });

  it("does not prompt for notification permission off the iPhone shell", async () => {
    const perm = await requestSalahNotificationPermission();
    assert.equal(perm.granted, false);
    assert.equal(perm.reason, "not-native");
  });
});
