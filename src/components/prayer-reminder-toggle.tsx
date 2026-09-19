import { useEffect, useState } from "react";
import {
  browserNotificationEnv,
  readPrayerReminders,
  requestPrayerNotificationPermission,
  writePrayerReminders,
} from "@/lib/prayer-reminder";
import { t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export function PrayerReminderToggle({ lang }: { lang: Lang }) {
  const [on, setOn] = useState(false);
  const [note, setNote] = useState<"denied" | null>(null);

  useEffect(() => {
    setOn(readPrayerReminders(typeof localStorage === "undefined" ? null : localStorage));
  }, []);

  async function toggle() {
    const next = !on;
    writePrayerReminders(next, typeof localStorage === "undefined" ? null : localStorage);
    setOn(next);
    if (!next) {
      setNote(null);
      return;
    }
    const permission = await requestPrayerNotificationPermission(browserNotificationEnv());
    if (permission === "denied") setNote("denied");
    else setNote(null);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <div>
        <p className="text-sm font-medium">{t(lang, "prayerReminders")}</p>
        <p className="text-xs text-muted">
          {note === "denied"
            ? t(lang, "prayerRemindersDenied")
            : on
              ? t(lang, "prayerRemindersOn")
              : t(lang, "prayerRemindersOff")}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => void toggle()}
        className={cn(
          "relative h-7 w-12 rounded-full transition-colors",
          on ? "bg-primary" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-6 rounded-full bg-bg transition-[inset-inline-start]",
            on ? "start-5" : "start-0.5",
          )}
        />
      </button>
    </div>
  );
}
