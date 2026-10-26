import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSettings } from "@/store/settings-store";
import { useAppStore } from "@/store/app-store";
import { getTimesInZone, PRAYER_KEYS, PRAYER_LABELS } from "@/lib/prayer";
export function HomeDay() {
  const s = useSettings((x) => x.settings);
  const city = useAppStore((x) => x.city);
  const [now, setNow] = useState<Date | null>(null);
  const [intro, setIntro] = useState<boolean | null>(null);
  const [book, setBook] = useState("");
  useEffect(() => {
    const refresh = () => setNow(new Date());
    refresh();
    const timer = setInterval(refresh, 60000);
    try {
      setIntro(localStorage.getItem("waha:onboarding:v1") !== "done");
      const saved = localStorage.getItem("waha:last-book") || "";
      if (/^\/books\/(?:alhajda|trading-guide|(?:library|read)\/[a-zA-Z0-9_%.-]+)$/.test(saved))
        setBook(saved);
    } catch {
      /* Optional local preferences. */
    }
    return () => clearInterval(timer);
  }, []);
  const locale = s.language === "ar" ? "ar-SA" : "en-GB";
  let prayer: { label: string; at: Date } | null = null;
  if (now) {
    try {
      const times = getTimesInZone(city.lat, city.lon, now, city.tz);
      const key = PRAYER_KEYS.find((k) => k !== "sunrise" && times[k] > now);
      if (key) prayer = { label: PRAYER_LABELS[key][s.language], at: times[key] };
      else {
        const tomorrow = new Date(now.getTime() + 86400000);
        prayer = {
          label: PRAYER_LABELS.fajr[s.language],
          at: getTimesInZone(city.lat, city.lon, tomorrow, city.tz).fajr,
        };
      }
    } catch {
      /* Invalid location never produces invented prayer times. */
    }
  }
  const hour = now
    ? Number(
        new Intl.DateTimeFormat("en-GB", {
          hour: "numeric",
          hourCycle: "h23",
          timeZone: city.tz,
        }).format(now),
      )
    : 12;
  const greeting =
    s.language === "ar"
      ? hour < 12
        ? "صباح الخير، في واحتك"
        : hour < 18
          ? "طاب يومك في واحة"
          : "مساء الخير، في واحتك"
      : hour < 12
        ? "Good morning"
        : "Welcome to your oasis";
  return (
    <>
      <header className="space-y-3">
        <p className="text-sm text-primary">واحة · عالمك بين يديك</p>
        <h1 className="min-h-[2.4em] font-display text-3xl sm:min-h-[1.2em]">
          {now ? greeting : "أهلًا بك في واحة"}
        </h1>
        <p className="min-h-12 text-sm leading-6 text-muted">
          {now && (
            <>
              {new Intl.DateTimeFormat(locale, {
                dateStyle: "long",
                calendar: "islamic-umalqura",
                numberingSystem: s.digits,
                timeZone: city.tz,
              }).format(now)}
              <br />
              {new Intl.DateTimeFormat(locale, {
                dateStyle: "long",
                calendar: "gregory",
                numberingSystem: s.digits,
                timeZone: city.tz,
              }).format(now)}
            </>
          )}
        </p>
      </header>
      <aside
        className="flex min-h-28 flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4"
        aria-label="واحتك على ذوقك"
      >
        <p className="text-sm text-muted">
          {intro ? "ثلاث خطوات خفيفة، واحة أقرب إليك." : "مساحة هادئة، على ذوقك ولكل يوم."}
        </p>
        <Link
          to={intro ? "/onboarding" : "/settings"}
          className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-primary-fg"
        >
          {intro ? "خصّص واحتك" : "تخصيص يومك"}
        </Link>
      </aside>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/app/$id"
          params={{ id: "salah" }}
          className="min-h-24 rounded-2xl border border-border bg-surface p-4"
        >
          <span className="block text-sm text-muted">
            الصلاة القادمة · {city[s.language]} · أم القرى
          </span>
          <span className="mt-2 block text-lg">
            {prayer
              ? `${prayer.label} · ${new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", numberingSystem: s.digits, timeZone: city.tz }).format(prayer.at)}`
              : "مواقيت الصلاة ←"}
          </span>
        </Link>
        {book && (
          <Link
            to={book}
            className="flex min-h-24 flex-col justify-center rounded-2xl border border-border bg-surface p-4"
          >
            <span className="text-lg">كمل القراءة ←</span>
            <span className="mt-2 text-sm text-muted">
              عد إلى كتابك وموضعك المحفوظ على هذا الجهاز
            </span>
          </Link>
        )}
      </div>
    </>
  );
}
