import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  PILLARS,
  dayKey,
  dayPrefs,
  moveCard,
  pillarCards,
  type DayPrefs,
} from "@/lib/personal-day";
import { useAppStore } from "@/store/app-store";
import { nextPrayerVisible, getTimesInZone, formatHm, PRAYER_LABELS } from "@/lib/prayer";
import { formatLiveHms } from "@/lib/clock";
import { dailyAyah, riyadhDay, validPosition } from "@/lib/quran";
import { ExternalLink } from "@/components/external-link";
import { NewsLive } from "@/components/news-live";
import { HayatCard } from "@/components/hayat-card";
import { featureButton } from "@/lib/share-card";
import { ALHAJDA_READING_KEY } from "@/lib/books/curated";

const names: Record<string, string> = {
  prayer: "الصلاة القادمة",
  ayah: "آية وورد اليوم",
  athkar: "أذكار",
  news: "موجز الأخبار",
  wamda: "ومضة اليوم",
  hayat: "حياة",
  luma: "لُمعة",
  reading: "متابعة القراءة",
  knowledge: "معرفة اليوم",
  hissati: "حصص هذا الأسبوع",
};
const optional = ["athkar", "hayat", "luma", "knowledge"];
function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}
export function PersonalDay({ userId, interests }: { userId?: string; interests: string[] }) {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const recent = useAppStore((s) => s.recent);
  const pushRecent = useAppStore((s) => s.pushRecent);
  const [prefs, setPrefs] = useState<DayPrefs>(() => dayPrefs(null));
  const [loadedKey, setLoadedKey] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState<Date | null>(null);
  const [position, setPosition] = useState<ReturnType<typeof validPosition>>(null);
  const [wird, setWird] = useState(0);
  const [chapter, setChapter] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [editing, setEditing] = useState(false);
  const [drag, setDrag] = useState<string | null>(null);
  const key = dayKey(userId);
  useEffect(() => {
    setPrefs(dayPrefs(read(key)));
    setLoadedKey(key);
    const refresh = () => {
      setNow(new Date());
      setPosition(validPosition(read("waha-quran-position")));
      const w = read("waha-quran-wird") as { day?: string; count?: number } | null;
      setWird(
        w?.day === riyadhDay() && Number.isFinite(w.count) ? Math.max(0, Number(w.count)) : 0,
      );
      const r = read(ALHAJDA_READING_KEY) as { chapter?: number } | null;
      setChapter(
        Number.isInteger(r?.chapter) && Number(r?.chapter) >= 0 && Number(r?.chapter) < 11
          ? Number(r?.chapter)
          : null,
      );
      try {
        setDone(localStorage.getItem("waha-wamda-day") === riyadhDay());
      } catch {
        /* optional storage */
      }
    };
    refresh();
    const timer = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [key]);
  function save(next: DayPrefs) {
    if (loadedKey !== key) return;
    setPrefs(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setNotice("حُفظ تخصيص يومك على هذا الجهاز.");
    } catch {
      setNotice("تعذّر الحفظ؛ التخصيص مؤقت لهذه الزيارة.");
    }
  }
  const verse = dailyAyah(now ? riyadhDay(now) : "2026-10-15");
  let prayer = now ? nextPrayerVisible(city.lat, city.lon, now, city.tz) : null;
  if (prayer?.key === "sunrise" && now) {
    const at = getTimesInZone(city.lat, city.lon, now, city.tz).dhuhr;
    prayer = { key: "dhuhr", at, hm: formatHm(at, lang, city.tz), label: PRAYER_LABELS.dhuhr };
  }
  const questions = [
    "كيف تميّز بين المعلومة والرأي؟",
    "متى تكون الموافقة اختيارًا حرًا؟",
    "كيف تفحص مصدر الحجة؟",
    "ما الذي يجعل قرارًا عادلًا؟",
    "كيف تغيّر الذاكرة ما نرويه؟",
    "ما الفرق بين اليقين والترجيح؟",
    "كيف نوازن بين مصلحة الإنسان والطبيعة؟",
  ];
  const question = questions[now ? Math.floor(now.getTime() / 86400000) % questions.length : 0];
  const cards: Record<string, ReactNode> = {
    prayer: (
      <>
        <p className="text-sm text-muted">الصلاة القادمة · {city[lang]} · أم القرى</p>
        <p className="my-3 text-2xl font-semibold">
          {prayer ? `${prayer.label[lang]} · ${prayer.hm}` : "جارٍ حساب المواقيت…"}
        </p>
        {prayer && now && (
          <p dir="ltr" className="font-mono">
            {formatLiveHms(prayer.at.getTime() - now.getTime())}
          </p>
        )}
        <Link to="/app/$id" params={{ id: "salah" }} className={featureButton}>
          المواقيت وتغيير المدينة
        </Link>
      </>
    ),
    ayah: (
      <>
        <p className="font-display text-2xl leading-loose">{verse.text}</p>
        <p className="my-2 text-sm text-muted">
          {verse.name} · {verse.number} — ورد اليوم: {wird} آية
        </p>
        <Link
          to="/quran"
          search={position || { surah: verse.surah, ayah: verse.number }}
          className={featureButton}
        >
          {position ? `تابع وردك · ${position.surah}:${position.ayah}` : "ابدأ وردك في المصحف"}
        </Link>
      </>
    ),
    athkar: (
      <Link to="/app/$id" params={{ id: "athkar" }} className={featureButton}>
        أذكار الصباح والمساء
      </Link>
    ),
    news: <NewsLive compact />,
    wamda: (
      <>
        <p className="mb-3 leading-7">تحدي ومضة اليوم: دقيقة هادئة لآية وعمل طيب.</p>
        <button
          className={featureButton}
          aria-pressed={done}
          onClick={() => {
            const next = !done;
            setDone(next);
            try {
              if (next) localStorage.setItem("waha-wamda-day", riyadhDay());
              else localStorage.removeItem("waha-wamda-day");
            } catch {
              setNotice("تعذّر حفظ إنجاز ومضة.");
            }
          }}
        >
          {done ? "✓ أتممت ومضة اليوم" : "أتممت التحدي"}
        </button>
      </>
    ),
    hayat: <HayatCard />,
    luma: (
      <ExternalLink
        onClick={() => pushRecent("luma")}
        href="https://games.alhajda.com"
        className={featureButton}
      >
        لُمعة · باحة الألعاب العربية ↗
      </ExternalLink>
    ),
    reading: (
      <>
        <p className="mb-3">
          {chapter === null
            ? "كتاب ينتظرك، ولو صفحة كل يوم."
            : `موضعك المحفوظ في الهجدة · الفصل ${chapter + 1}`}
        </p>
        <Link to="/books/alhajda" className={featureButton}>
          {chapter === null ? "ابدأ القراءة" : "تابع من موضعك"}
        </Link>
        <ExternalLink href="https://midad.alhajda.com/library" className={featureButton}>
          مكتبة مداد ↗
        </ExternalLink>
      </>
    ),
    knowledge: (
      <>
        <p className="mb-3 leading-7">
          سؤال اليوم: {question} اقرأ فقرة من «الهجدة» وتتبع مصدر حجتها.
        </p>
        <Link to="/books/alhajda" className={featureButton}>
          اكتشف معرفة اليوم
        </Link>
        <p className="mt-2 text-xs text-muted">اقتراح قراءة من واحة؛ لا يُنسب إلى موجز مداد.</p>
      </>
    ),
    hissati: (
      <>
        <p className="mb-3 leading-7">
          دفتر المعلم لمنصة مدرستي: تحضير الأهداف الأسبوعية وكشف الدرجات.
        </p>
        <p className="mb-3 text-sm text-muted">
          افتح خطتك داخل حصتي للاطلاع على حصصك؛ بياناتها وحسابها محفوظان في حصتي.
        </p>
        <div className="flex flex-wrap gap-2">
          <ExternalLink
            href="https://hissati.alhajda.com/app/weekly"
            className={featureButton}
            data-hissati="weekly"
          >
            حصص هذا الأسبوع ↗
          </ExternalLink>
          <ExternalLink href="https://hissati.alhajda.com/app/tahdeeri" className={featureButton}>
            تحضيري ↗
          </ExternalLink>
          <ExternalLink href="https://hissati.alhajda.com/app/grades" className={featureButton}>
            كشف الدرجات ↗
          </ExternalLink>
          <ExternalLink href="https://hissati.alhajda.com" className={featureButton}>
            افتح حصتي كاملًا ↗
          </ExternalLink>
        </div>
      </>
    ),
  };
  return (
    <div
      className="personal-day space-y-6 rounded-2xl p-2 sm:p-4"
      data-day-theme={prefs.theme}
      style={{ fontSize: prefs.font }}
    >
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p>
            {now
              ? new Intl.DateTimeFormat("ar-SA", { hour: "numeric", timeZone: city.tz })
                  .format(now)
                  .includes("ص")
                ? "صباح الخير"
                : "مساء الخير"
              : "أهلًا بك"}{" "}
            · أربع ركائز ليومك
          </p>
          <button
            className={featureButton}
            onClick={() => setEditing(!editing)}
            aria-expanded={editing}
          >
            تخصيص البطاقات والمظهر
          </button>
        </div>
        {editing && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted">
              اسحب البطاقات داخل الركيزة، أو استخدم السهمين. تبقى الركائز الأربع ثابتة. الحفظ محلي
              لهذا المستخدم؛ المزامنة بين الأجهزة غير متاحة بعد.
            </p>
            <div className="flex flex-wrap gap-3">
              <label>
                السمة
                <select
                  aria-label="سمة يومي"
                  value={prefs.theme}
                  onChange={(e) => save({ ...prefs, theme: e.target.value as DayPrefs["theme"] })}
                  className="mx-2 min-h-11 rounded-lg border border-border bg-surface px-3"
                >
                  <option value="day">نهار</option>
                  <option value="night">ليل</option>
                  <option value="gold">ذهبي الهجدة</option>
                </select>
              </label>
              <label>
                حجم الخط
                <select
                  aria-label="حجم خط يومي"
                  value={prefs.font}
                  onChange={(e) => save({ ...prefs, font: Number(e.target.value) })}
                  className="mx-2 min-h-11 rounded-lg border border-border bg-surface px-3"
                >
                  <option value="16">عادي</option>
                  <option value="18">كبير</option>
                  <option value="20">أكبر</option>
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {optional
                .filter((id) => prefs.hidden.includes(id))
                .map((id) => (
                  <button
                    key={id}
                    className={featureButton}
                    onClick={() => save({ ...prefs, hidden: prefs.hidden.filter((x) => x !== id) })}
                  >
                    إظهار {names[id]}
                  </button>
                ))}
            </div>
            <button className={featureButton} onClick={() => save(dayPrefs(null))}>
              استعادة الافتراضي
            </button>
          </div>
        )}
        <p role="status" className="mt-2 text-sm text-muted">
          {notice}
        </p>
      </div>
      {PILLARS.map((pillar, index) => (
        <section
          key={pillar.id}
          data-pillar={pillar.id}
          aria-labelledby={`pillar-${pillar.id}`}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm text-primary">0{index + 1}</span>
            <h2 id={`pillar-${pillar.id}`} className="font-display text-3xl">
              {lang === "ar" ? pillar.ar : pillar.en}
            </h2>
            {interests.includes(pillar.id) && (
              <span className="rounded-full bg-primary/10 px-3 py-2 text-sm text-primary">
                من اهتماماتك
              </span>
            )}
          </div>
          {pillar.id === "fun" && recent.some((id) => id === "hayat" || id === "luma") && (
            <p className="text-sm text-muted">
              آخر لعبة فتحتها:{" "}
              {recent.find((id) => id === "hayat" || id === "luma") === "hayat" ? "حياة" : "لُمعة"}{" "}
              · تقدم اللعب محفوظ لدى اللعبة نفسها.
            </p>
          )}
          {interests.includes(pillar.id) && (
            <nav aria-label={`المزيد في ${pillar.ar}`} className="flex flex-wrap gap-2">
              {pillar.id === "faith" ? (
                <Link to="/app/$id" params={{ id: "qibla" }} className={featureButton}>
                  اتجاه القبلة
                </Link>
              ) : pillar.id === "news" ? (
                <Link to="/news" className={featureButton}>
                  تصفّح التصنيفات والمصادر
                </Link>
              ) : pillar.id === "fun" ? (
                <Link to="/games" className={featureButton}>
                  كل ألعاب واحة
                </Link>
              ) : (
                <ExternalLink href="https://hissati.alhajda.com/explore" className={featureButton}>
                  مسارات التعلم في حصتي ↗
                </ExternalLink>
              )}
            </nav>
          )}
          {pillarCards(pillar.cards, prefs).map((id, i, all) => (
            <article
              key={id}
              data-day-card={id}
              draggable={editing}
              onDragStart={() => setDrag(id)}
              onDragOver={(e) => {
                if (drag && all.includes(drag)) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (drag && all.includes(drag)) {
                  const order = [...all];
                  order.splice(order.indexOf(drag), 1);
                  order.splice(order.indexOf(id), 0, drag);
                  save({
                    ...prefs,
                    order: [...order, ...prefs.order.filter((x) => !all.includes(x))],
                  });
                }
                setDrag(null);
              }}
              className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">
                  {prefs.pinned.includes(id) ? "★ " : ""}
                  {names[id]}
                </h3>
                {editing && (
                  <div className="flex flex-wrap gap-1">
                    <button
                      className={featureButton}
                      aria-label={`رفع ${names[id]}`}
                      disabled={i === 0}
                      onClick={() => save(moveCard(prefs, pillar.cards, id, -1))}
                    >
                      ↑
                    </button>
                    <button
                      className={featureButton}
                      aria-label={`خفض ${names[id]}`}
                      disabled={i === all.length - 1}
                      onClick={() => save(moveCard(prefs, pillar.cards, id, 1))}
                    >
                      ↓
                    </button>
                    <button
                      className={featureButton}
                      aria-pressed={prefs.pinned.includes(id)}
                      onClick={() =>
                        save({
                          ...prefs,
                          pinned: prefs.pinned.includes(id)
                            ? prefs.pinned.filter((x) => x !== id)
                            : [...prefs.pinned, id],
                        })
                      }
                    >
                      تثبيت {names[id]}
                    </button>
                    {optional.includes(id) && (
                      <button
                        className={featureButton}
                        onClick={() => save({ ...prefs, hidden: [...prefs.hidden, id] })}
                      >
                        إخفاء {names[id]}
                      </button>
                    )}
                  </div>
                )}
              </div>
              {cards[id]}
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
