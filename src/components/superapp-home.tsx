import { HomeWeather } from "./home-weather";
import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ServiceGrid } from "./service-grid";
import { PersonalDay } from "./personal-day";
import { SERVICES, progressState, progressSummary } from "@/lib/superapp";
import { useAppStore } from "@/store/app-store";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { interestKey, normalizeInterests } from "@/lib/interests";
import { usePersistent } from "@/lib/storage";
import { riyadhDay } from "@/lib/quran";
const SquarePage = lazy(() =>
  import("./square/square-page").then((m) => ({ default: m.SquarePage })),
);
export function SuperAppHome() {
  const { user } = useCurrentUserState();
  const lang = useAppStore((s) => s.lang);
  const recent = useAppStore((s) => s.recent);
  const [interests, setInterests] = useState<string[]>([]);
  useEffect(() => {
    if (!user || user.isDevFallback) {
      setInterests([]);
      return;
    }
    try {
      setInterests(
        normalizeInterests(JSON.parse(localStorage.getItem(interestKey(user.id)) || "[]")),
      );
    } catch {
      setInterests([]);
    }
  }, [user]);
  const [raw, setProgress, ready] = usePersistent<unknown>("waha:superapp:progress:v1", {
    days: [],
  });
  const [today, setToday] = useState("");
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    const refresh = () => setToday(riyadhDay());
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => clearInterval(timer);
  }, []);
  const progress = progressState(raw),
    summary = progressSummary(progress, today || "1970-01-01");
  const resume = recent
    .map((id) => SERVICES.find((s) => s.id === id))
    .filter((s) => s != null)
    .slice(0, 4);
  return (
    <div className="mx-auto max-w-3xl space-y-8" data-superapp="1.2.1">
      <header>
        <p className="text-sm text-primary">واحة · عالمك بين يديك</p>
        <h1 className="font-display text-3xl">تطبيقاتك، ليومك كله</h1>
      </header>
      <ServiceGrid compact />
      <div className="grid grid-cols-2 gap-3" aria-label="ودجات اليوم">
        {[
          ["weather", "الطقس الآن"],
          ["salah", "الصلاة القادمة"],
          ["hissati", "درس اليوم"],
          ["news", "الموجز"],
        ].map(([id, label]) => (
          <Link
            key={id}
            to={id === "news" ? "/news" : "/app/$id"}
            params={{ id }}
            className="min-h-20 rounded-2xl border border-border bg-surface p-4"
          >
            {id === "weather" ? <HomeWeather /> : <>{label} ←</>}
          </Link>
        ))}
      </div>
      {resume.length > 0 && (
        <section aria-label="تابع من حيث توقفت">
          <h2 className="mb-3 font-display text-2xl">
            {lang === "ar" ? "تابع من حيث توقفت" : "Continue where you left off"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {resume.map((s) => (
              <Link
                to={s.href}
                key={s.id}
                className="min-h-14 rounded-xl border border-border bg-surface p-4 text-sm"
              >
                {s.title[lang]} ←
              </Link>
            ))}
          </div>
        </section>
      )}
      <section
        className="rounded-2xl border border-border bg-surface p-5"
        aria-label="تقدمك المحلي"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">
            {lang === "ar" ? "خطوة كل يوم" : "A step each day"}
          </h2>
          <span>
            {summary.xp} XP · {summary.streak} {lang === "ar" ? "أيام متتالية" : "day streak"}
          </span>
        </div>
        <p className="my-3 text-sm leading-7 text-muted">
          {lang === "ar"
            ? "بعد وردك أو درسك، سجّل إنجاز اليوم (+١٠ نقاط مرة يوميًا). التقدم والسلسلة محفوظان على هذا الجهاز؛ حسابات وتقدم الخدمات المضمّنة مستقلة."
            : "After your wird or lesson, mark today complete (+10 XP once daily). Progress is saved on this device; embedded services have separate accounts and progress."}
        </p>
        <button
          disabled={!ready || !today || summary.done}
          onClick={() => {
            const next = { days: [...progress.days, today] };
            try {
              localStorage.setItem("waha:superapp:progress:v1", JSON.stringify(next));
              setProgress(next);
              setStorageError(false);
            } catch {
              setStorageError(true);
            }
          }}
          className="min-h-11 rounded-xl bg-primary px-5 text-primary-fg disabled:opacity-60"
        >
          {summary.done
            ? lang === "ar"
              ? "✓ أنجزت اليوم"
              : "✓ Done today"
            : lang === "ar"
              ? "أتممت خطوة اليوم"
              : "Complete today’s step"}
        </button>
        {storageError && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {lang === "ar"
              ? "تعذّر حفظ إنجازك على هذا الجهاز. تحقق من إتاحة التخزين ثم أعد المحاولة."
              : "Could not save on this device. Check storage and retry."}
          </p>
        )}
      </section>
      <section aria-label="بطاقة اليوم">
        <h2 className="mb-4 font-display text-2xl">{lang === "ar" ? "بطاقة اليوم" : "Your day"}</h2>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Link
            to="/app/$id"
            params={{ id: "hissati" }}
            className="min-h-14 rounded-xl border border-border p-4"
          >
            درس اليوم · موسوعة حصتي
          </Link>
          <Link
            to="/play/$game"
            params={{ game: "dallah" }}
            className="min-h-14 rounded-xl border border-border p-4"
          >
            لعبة اليوم · قفز الدلّة
          </Link>
        </div>
        <PersonalDay
          userId={user && !user.isDevFallback ? user.id : undefined}
          interests={interests}
        />
      </section>
      <Suspense fallback={<p role="status">جارٍ تحميل الميدان…</p>}>
        <SquarePage />
      </Suspense>
    </div>
  );
}
