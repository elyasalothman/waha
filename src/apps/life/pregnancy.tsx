import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d;
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function PregnancyApp() {
  const lang = useAppStore((s) => s.lang);
  const [lmp, setLmp] = usePersistent("waha:pregnancy-lmp", "");
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const info = useMemo(() => {
    if (!lmp) return null;
    const start = new Date(`${lmp}T00:00:00`);
    if (!Number.isFinite(start.getTime())) return null;
    const due = addDays(lmp, 280);
    const elapsed = daysBetween(start, now);
    const week = Math.floor(elapsed / 7);
    const day = elapsed % 7;
    const left = daysBetween(now, due);
    const tri = week < 13 ? 1 : week < 28 ? 2 : 3;
    return { due, week: Math.max(0, week), day: Math.max(0, day), left, tri, elapsed };
  }, [lmp, now.getTime()]);

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{L("أول يوم لآخر دورة", "First day of last period")}</span>
        <Input type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} />
      </label>
      {info ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs text-muted">{L("الأسبوع", "Week")}</p>
            <p className="mt-1 font-display text-4xl tabular-nums">
              {info.week}
              <span className="text-lg text-muted">+{info.day}</span>
            </p>
            <p className="mt-2 text-sm text-muted">
              {L(`الثلث ${info.tri === 1 ? "الأول" : info.tri === 2 ? "الثاني" : "الثالث"}`, `Trimester ${info.tri}`)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs text-muted">{L("الولادة المتوقعة", "Due date")}</p>
            <p className="mt-1 font-display text-2xl">
              {new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(info.due)}
            </p>
            <p className="mt-2 text-sm text-muted">
              {info.left >= 0 ? L(`بعد ${info.left} يوماً`, `in ${info.left} days`) : L("تجاوز التاريخ المتوقع", "Past the estimated date")}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">{L("أدخل التاريخ ليظهر الأسبوع والموعد.", "Enter the date to see the week and due date.")}</p>
      )}
      <p className="text-xs text-subtle">{L("حساب تقريبي بقاعدة نايجل، وليس بديلاً عن الطبيب.", "A Naegele estimate — not a substitute for a doctor.")}</p>
    </div>
  );
}
