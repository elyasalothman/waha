import { useEffect, useState } from "react";
import { useSettings } from "@/store/settings-store";
import { useAppStore } from "@/store/app-store";
import { getTimesInZone, PRAYER_KEYS, PRAYER_LABELS } from "@/lib/prayer";
import midad from "@/lib/books/platform/midad.json";
import { RESEARCH_LINKS } from "@/lib/research-catalog";

/** Next prayer as text. Uses the saved city; it does not ask for device location. */
export function DisplayPrayer() {
  const settings = useSettings((s) => s.settings);
  const city = useAppStore((s) => s.city);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, []);
  let line = "تُحسب المواقيت من المدينة المحفوظة.";
  if (now) {
    try {
      const times = getTimesInZone(city.lat, city.lon, now, city.tz);
      const key = PRAYER_KEYS.find((item) => item !== "sunrise" && times[item] > now);
      const at = key
        ? times[key]
        : getTimesInZone(city.lat, city.lon, new Date(now.getTime() + 86400000), city.tz).fajr;
      const label = PRAYER_LABELS[key || "fajr"][settings.language];
      line = `${label} · ${new Intl.DateTimeFormat(settings.language === "ar" ? "ar-SA" : "en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        numberingSystem: settings.digits,
        timeZone: city.tz,
      }).format(at)}`;
    } catch {
      line = "تعذّر حساب المواقيت لهذه المدينة.";
    }
  }
  return (
    <section
      aria-label="الصلاة القادمة"
      data-home-widget="prayer"
      className="waha-card tint-rose"
    >
      <h2 className="text-lg">🕌 الصلاة القادمة</h2>
      <p className="mt-2 text-sm text-muted">{city[settings.language]} · أم القرى</p>
      <p className="mt-2 text-xl">{line}</p>
    </section>
  );
}

/** Hijri and civil date for the saved city. Text only. */
export function DisplayDate() {
  const settings = useSettings((s) => s.settings);
  const city = useAppStore((s) => s.city);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);
  const locale = settings.language === "ar" ? "ar-SA" : "en-GB";
  const format = (calendar: "islamic-umalqura" | "gregory") =>
    now
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "full",
          calendar,
          numberingSystem: settings.digits,
          timeZone: city.tz,
        }).format(now)
      : "…";
  return (
    <section
      aria-label="تاريخ اليوم"
      data-home-widget="hijri"
      className="waha-card tint-violet"
    >
      <h2 className="text-lg">🌙 تاريخ اليوم</h2>
      <p className="mt-2 leading-7">{format("islamic-umalqura")}</p>
      <p className="text-sm leading-7 text-muted">{format("gregory")}</p>
    </section>
  );
}

/** First paragraph of a real Midad text. No link; the library stays in the app bar. */
export function DisplayReading() {
  const [piece, setPiece] = useState<{ title: string; author: string; text: string } | null>();
  useEffect(() => {
    const meta = midad[Math.floor(Date.now() / 86400000) % midad.length];
    if (!meta) return;
    let live = true;
    fetch(`/books/midad/${meta.id}.json`)
      .then(async (response) => {
        if (!response.ok) throw new Error("missing");
        return response.json();
      })
      .then((data) => {
        const text = data?.chapters?.[0]?.paragraphs?.[0];
        if (!live) return;
        if (typeof text !== "string" || !text.trim()) throw new Error("empty");
        setPiece({ title: meta.title, author: meta.author, text: text.trim() });
      })
      .catch(() => {
        if (live) setPiece(null);
      });
    return () => {
      live = false;
    };
  }, []);
  return (
    <section aria-label="قراءة اليوم" data-home-widget="reading" className="waha-card tint-sand">
      <h2 className="kicker-sand text-lg">📚 قراءة اليوم</h2>
      {piece === undefined ? (
        <p role="status" className="mt-3 text-sm text-muted">
          جارٍ فتح نص من مداد…
        </p>
      ) : piece === null ? (
        <p role="status" className="mt-3 text-sm text-muted">
          تعذّر فتح نص اليوم.
        </p>
      ) : (
        <>
          <p className="mt-2 font-display text-2xl">{piece.title}</p>
          <p className="text-sm text-muted">{piece.author}</p>
          <p className="mt-3 leading-8">{piece.text}</p>
        </>
      )}
    </section>
  );
}

/** Titles observed on the research index. Text only. */
export function DisplayResearch() {
  return (
    <section aria-label="مركز الأبحاث" data-home-widget="research" className="waha-card tint-sky">
      <h2 className="kicker-sky text-lg">🔬 مركز الأبحاث</h2>
      <ul className="mt-3 space-y-3">
        {RESEARCH_LINKS.map((item) => (
          <li key={item.id}>
            <p className="font-medium">{item.title}</p>
            <p className="text-sm leading-7 text-muted">{item.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
