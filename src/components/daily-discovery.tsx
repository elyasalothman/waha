import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { dailyAyah, riyadhDay } from "@/lib/quran";
import { featureButton, shareCard } from "@/lib/share-card";
export function DailyDiscovery() {
  const [day, setDay] = useState("");
  const [done, setDone] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const d = riyadhDay();
    setDay(d);
    try {
      setDone(localStorage.getItem("waha-wamda-day") === d);
    } catch {
      /* optional storage */
    }
  }, []);
  const verse = dailyAyah(day || "2026-10-15");
  return (
    <section
      className="rounded-2xl border border-border bg-surface p-5"
      dir="rtl"
      aria-label="آية اليوم وتحدي ومضة"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">آية اليوم</h2>
        <Link
          to="/quran"
          search={{ surah: verse.surah, ayah: verse.number }}
          className={featureButton}
        >
          افتح المصحف
        </Link>
      </div>
      <p className="my-5 font-display text-2xl leading-[2.2]">{verse.text}</p>
      <p className="text-sm text-muted">
        {verse.name} · الآية {verse.number}
      </p>
      <button
        className={`${featureButton} my-3`}
        onClick={() => {
          void shareCard(
            "آية اليوم · واحة",
            `${verse.text}\n${verse.name} · ${verse.number}`,
            `${location.origin}/quran?surah=${verse.surah}&ayah=${verse.number}`,
          )
            .then(() => setNotice("تمت المشاركة أو نسخ البطاقة."))
            .catch(() => setNotice("لم تتم المشاركة."));
        }}
      >
        مشاركة بطاقة الآية
      </button>
      <div className="mt-4 border-t border-border pt-4">
        <h3 className="font-semibold">تحدي ومضة اليوم</h3>
        <p className="my-3 leading-7">
          دقيقة هادئة: اقرأ آية اليوم بتأنٍّ، واختر عملًا طيبًا صغيرًا تبدأ به يومك.
        </p>
        <button
          className={featureButton}
          aria-pressed={done}
          onClick={() => {
            setDone(!done);
            try {
              if (done) localStorage.removeItem("waha-wamda-day");
              else localStorage.setItem("waha-wamda-day", day);
            } catch {
              setNotice("تعذّر حفظ الإنجاز على الجهاز.");
            }
          }}
        >
          {done ? "✓ أتممت ومضة اليوم" : "أتممت التحدي"}
        </button>
      </div>
      <p role="status" className="mt-2 text-sm text-muted">
        {notice}
      </p>
    </section>
  );
}
