import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PRAYER_REMINDER_KEY,
  readPrayerReminders,
  requestPrayerNotificationPermission,
  writePrayerReminders,
} from "./prayer-reminder.ts";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    removeItem: (key: string) => {
      delete data[key];
    },
  };
}

describe("prayer reminders", () => {
  it("stores the toggle locally as 1 / missing", () => {
    const storage = memoryStorage();
    assert.equal(readPrayerReminders(storage), false);
    assert.equal(writePrayerReminders(true, storage), true);
    assert.equal(storage.getItem(PRAYER_REMINDER_KEY), "1");
    assert.equal(readPrayerReminders(storage), true);
    writePrayerReminders(false, storage);
    assert.equal(readPrayerReminders(storage), false);
  });

  it("asks Capacitor LocalNotifications first, then the web API, else unsupported", async () => {
    const cap = await requestPrayerNotificationPermission({
      capacitor: {
        Plugins: {
          LocalNotifications: {
            requestPermissions: async () => ({ display: "granted" }),
          },
        },
      },
    });
    assert.equal(cap, "granted");

    const web = await requestPrayerNotificationPermission({
      Notification: { requestPermission: async () => "denied" },
    });
    assert.equal(web, "denied");

    const none = await requestPrayerNotificationPermission({});
    assert.equal(none, "unsupported");
  });
});
