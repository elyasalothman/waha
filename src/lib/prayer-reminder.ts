export const PRAYER_REMINDER_KEY = "waha:prayer-reminders";

export type ReminderPermission = "granted" | "denied" | "unsupported";

export function readPrayerReminders(storage: Pick<Storage, "getItem"> | null | undefined): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(PRAYER_REMINDER_KEY) === "1";
  } catch {
    return false;
  }
}

export function writePrayerReminders(
  enabled: boolean,
  storage: Pick<Storage, "setItem" | "removeItem"> | null | undefined,
): boolean {
  if (!storage) return false;
  try {
    if (enabled) storage.setItem(PRAYER_REMINDER_KEY, "1");
    else storage.removeItem(PRAYER_REMINDER_KEY);
    return true;
  } catch {
    return false;
  }
}

type NotificationLike = {
  requestPermission?: () => Promise<string> | string;
};

type CapacitorNotifications = {
  requestPermissions?: () => Promise<{ display?: string } | undefined>;
};

/**
 * Stub permission request: Capacitor LocalNotifications when the iOS
 * shell injects it, otherwise the web Notification API. Never throws.
 */
export async function requestPrayerNotificationPermission(env: {
  capacitor?: { Plugins?: { LocalNotifications?: CapacitorNotifications } };
  Notification?: NotificationLike;
} = {}): Promise<ReminderPermission> {
  const cap = env.capacitor?.Plugins?.LocalNotifications;
  if (cap?.requestPermissions) {
    try {
      const result = await cap.requestPermissions();
      return result?.display === "granted" ? "granted" : "denied";
    } catch {
      return "denied";
    }
  }

  if (env.Notification?.requestPermission) {
    try {
      const result = await env.Notification.requestPermission();
      return result === "granted" ? "granted" : "denied";
    } catch {
      return "denied";
    }
  }

  return "unsupported";
}

export function browserNotificationEnv(): {
  capacitor?: { Plugins?: { LocalNotifications?: CapacitorNotifications } };
  Notification?: NotificationLike;
} {
  const g = globalThis as {
    Capacitor?: { Plugins?: { LocalNotifications?: CapacitorNotifications } };
    Notification?: NotificationLike;
  };
  return { capacitor: g.Capacitor, Notification: g.Notification };
}
