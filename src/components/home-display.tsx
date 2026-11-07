import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink } from "./external-link";
import { useSettings } from "@/store/settings-store";
import { useAppStore } from "@/store/app-store";
import { getTimesInZone, PRAYER_KEYS, PRAYER_LABELS } from "@/lib/prayer";
import { readingExcerpt } from "@/lib/books/reading-excerpt";
import type { MidadCard } from "@/lib/home-steady";
import { RESEARCH_LINKS } from "@/lib/research-catalog";

const cardLink =
  "waha-card block focus-visible:outline-2 focus-visible:outline-offset-2";

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
    <Link
      to="/app/$id"
      params={{ id: "salah" }}
      aria-label="الصلاة القادمة"
      data-home-widget="prayer"
      className={`${cardLink} tint-rose`}
    >
      <h2 className="text-lg">🕌 الصلاة القادمة</h2>
      <p className="mt-2 text-sm text-muted">{city[settings.language]} · أم القرى</p>
      <p className="mt-2 text-xl">{line}</p>
    </Link>
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
    <Link
      to="/app/$id"
      params={{ id: "hijri" }}
      aria-label="تاريخ اليوم"
      data-home-widget="hijri"
      className={`${cardLink} tint-violet`}
    >
      <h2 className="text-lg">🌙 تاريخ اليوم</h2>
      <p className="mt-2 leading-7">{format("islamic-umalqura")}</p>
      <p className="text-sm leading-7 text-muted">{format("gregory")}</p>
    </Link>
  );
}

/** Opens the same Midad book the excerpt came from. The card quotes only an unmarked paragraph. */
export function DisplayReading({ book }: { book: MidadCard | null | undefined }) {
  const [text, setText] = useState<string | null | undefined>();
  useEffect(() => {
    if (!book) return;
    let live = true;
    setText(undefined);
    fetch(`/books/midad/${book.id}.json`)
      .then(async (response) => {
        if (!response.ok) throw new Error("missing");
        return response.json();
      })
      .then((data) => {
        const paragraphs = data?.chapters?.[0]?.paragraphs;
        if (!live) return;
        if (!Array.isArray(paragraphs)) throw new Error("empty");
        const excerpt = readingExcerpt(paragraphs.filter((item): item is string => typeof item === "string"));
        setText(excerpt?.text ?? null);
      })
      .catch(() => {
        if (live) setText(null);
      });
    return () => {
      live = false;
    };
  }, [book]);
  if (book === undefined) {
    return (
      <section aria-label="قراءة اليوم" data-home-widget="reading" className="waha-card tint-sand">
        <h2 className="kicker-sand text-lg">📚 قراءة اليوم</h2>
        <p role="status" className="mt-3 text-sm text-muted">
          جارٍ فتح نص من مداد…
        </p>
      </section>
    );
  }
  if (book === null) return null;
  return (
    <Link
      to="/books/library/$id"
      params={{ id: book.id }}
      aria-label={`قراءة اليوم: ${book.title}`}
      data-home-widget="reading"
      className={`${cardLink} tint-sand`}
    >
      <h2 className="kicker-sand text-lg">📚 قراءة اليوم</h2>
      <p className="mt-2 font-display text-2xl">{book.title}</p>
      <p className="text-sm text-muted">{book.author}</p>
      <p className="text-sm text-muted">فقرة من نص المؤلف في هذا الكتاب، بلا إعادة صياغة.</p>
      {text === undefined ? (
        <p role="status" className="mt-3 text-sm text-muted">
          جارٍ فتح النص…
        </p>
      ) : text ? (
        <p className="mt-3 leading-8">{text}</p>
      ) : (
        <p className="mt-3 text-sm leading-7 text-muted">
          تعذّر اقتباس فقرة غير معلّمة بـ (مثال). افتح الكتاب لقراءة كلام المؤلف كما كتبه.
        </p>
      )}
    </Link>
  );
}

/** Hudoo TV lives with the news widgets. The card opens the player; it does not claim the picture is already moving. */
export function DisplayBroadcast() {
  return (
    <Link
      to="/live"
      aria-label="البث المباشر"
      data-home-widget="broadcast"
      className={`${cardLink} tint-rose`}
    >
      <h2 className="text-lg">📺 البث المباشر</h2>
      <p className="mt-2 font-medium">تلفزيون هدوء السوق</p>
      <p className="mt-2 text-sm leading-7 text-muted">
        ضمن الأخبار. الصفحة تفتح المشغّل، ولا تُعلِن أن الصورة تعمل قبل أن تستمر.
      </p>
    </Link>
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
            <ExternalLink
              direct
              href={item.href}
              className="block min-h-11 rounded-xl py-1 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span className="block font-medium">{item.title}</span>
              <span className="mt-1 block text-sm leading-7 text-muted">{item.note}</span>
              <span className="block text-xs text-muted">
                {[item.status, item.updated, item.stated].filter(Boolean).join(" · ")}
              </span>
            </ExternalLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
