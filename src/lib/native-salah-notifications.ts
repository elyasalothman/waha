/** Native salah alerts — UNUserNotificationCenter via Capacitor. Not the web Notification API. */

export const SALAH_NOTIFICATION_ID = 1448;
export const SALAH_NOTIFY_KEY = "waha:salah-notify";

export function isNativeIos(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean; isNative?: boolean } })
    .Capacitor;
  return !!(cap && (cap.isNativePlatform?.() || cap.isNative === true));
}

export type SalahAlert = {
  id: number;
  title: string;
  body: string;
  at: Date;
};

export function buildSalahAlert(input: {
  prayerAr: string;
  prayerEn: string;
  lang: "ar" | "en";
  at: Date;
}): SalahAlert {
  const name = input.lang === "ar" ? input.prayerAr : input.prayerEn;
  return {
    id: SALAH_NOTIFICATION_ID,
    title: input.lang === "ar" ? "واحة" : "Waha",
    body: input.lang === "ar" ? `حان وقت صلاة ${name}` : `Time for ${name}`,
    at: input.at,
  };
}

export async function syncSalahNotification(
  enabled: boolean,
  alert: SalahAlert,
): Promise<{ ok: boolean; reason?: string }> {
  if (!isNativeIos()) return { ok: false, reason: "not-native" };

  const { LocalNotifications } = await import("@capacitor/local-notifications");
  await LocalNotifications.cancel({ notifications: [{ id: alert.id }] });
  if (!enabled) return { ok: true, reason: "cancelled" };

  const perm = await LocalNotifications.requestPermissions();
  if (perm.display !== "granted") return { ok: false, reason: "denied" };

  const when = alert.at.getTime() > Date.now() + 15_000 ? alert.at : new Date(Date.now() + 15_000);
  await LocalNotifications.schedule({
    notifications: [
      {
        id: alert.id,
        title: alert.title,
        body: alert.body,
        schedule: { at: when, allowWhileIdle: true },
      },
    ],
  });
  return { ok: true };
}
