import { useEffect, useState } from "react";
import { isNativeIos } from "@/lib/native-salah-notifications";

/** Daily reminders are opt-in, scheduled by iOS even after the app closes. */
export function NativeReminders() {
  const [native, setNative] = useState(false);
  const [enabled, setEnabled] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!isNativeIos()) return;
    setNative(true);
    void import("@capacitor/local-notifications")
      .then(async ({ LocalNotifications }) => {
        const pending = await LocalNotifications.getPending();
        setEnabled(pending.notifications.map((n) => n.id));
      })
      .catch(() => setMessage("تعذّر قراءة التذكيرات؛ أعد المحاولة."));
  }, []);
  if (!native) return null;
  async function toggle(id: number, hour: number, body: string) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      if (enabled.includes(id)) {
        await LocalNotifications.cancel({ notifications: [{ id }] });
        setEnabled((old) => old.filter((value) => value !== id));
        setMessage("أُلغي التذكير");
        return;
      }
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display !== "granted") {
        setMessage("اسمح بإشعارات واحة من إعدادات iPhone لتفعيل التذكير.");
        return;
      }
      await LocalNotifications.schedule({
        notifications: [
          { id, title: "واحة", body, schedule: { on: { hour, minute: 0 }, repeats: true } },
        ],
      });
      setEnabled((old) => [...old, id]);
      setMessage("فُعّل التذكير اليومي حسب توقيت الجهاز");
    } catch {
      setMessage("تعذّر تغيير التذكير؛ أعد المحاولة.");
    }
  }
  return (
    <details className="mx-auto mb-4 max-w-3xl rounded-xl border border-border bg-surface p-3">
      <summary className="min-h-11 cursor-pointer py-3">تذكيرات iPhone</summary>
      <p className="text-sm text-muted">
        تذكير الصلاة من أداة الصلاة. هذه تذكيرات يومية وليست تنبيهات أخبار عاجلة.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={enabled.includes(1450)}
          onClick={() => void toggle(1450, 20, "وقت وردك اليومي وقراءة القرآن")}
          className="min-h-11 rounded-lg border border-border px-4"
        >
          الورد ٨ مساءً: {enabled.includes(1450) ? "مفعّل" : "متوقف"}
        </button>
        <button
          type="button"
          aria-pressed={enabled.includes(1451)}
          onClick={() => void toggle(1451, 8, "اطّلع على موجز يومك في واحة")}
          className="min-h-11 rounded-lg border border-border px-4"
        >
          الموجز ٨ صباحًا: {enabled.includes(1451) ? "مفعّل" : "متوقف"}
        </button>
      </div>
      <p role="status" className="text-sm">
        {message}
      </p>
    </details>
  );
}
