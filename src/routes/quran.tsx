import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import surahs from "@/lib/quran-index.json";
import reciters from "@/lib/quran-reciters.json";
import { riyadhDay, validPosition } from "@/lib/quran";
import { ExternalLink } from "@/components/external-link";
import { featureButton, shareCard } from "@/lib/share-card";
type Surah = {
  number: number;
  name: string;
  ayahs: { number: number; text: string; juz: number }[];
};
export const Route = createFileRoute("/quran")({
  validateSearch: (s: Record<string, unknown>) => ({
    surah:
      Number.isInteger(Number(s.surah)) && Number(s.surah) >= 1 && Number(s.surah) <= 114
        ? Number(s.surah)
        : 1,
    ayah:
      Number.isInteger(Number(s.ayah)) && Number(s.ayah) > 0 && Number(s.ayah) <= 286
        ? Number(s.ayah)
        : 1,
  }),
  head: () => ({
    meta: [
      { title: "القرآن الكريم والتلاوة والورد اليومي · واحة" },
      {
        name: "description",
        content:
          "المصحف بالسور الـ114، تلاوة مشاري العفاسي وماهر المعيقلي، وحفظ موضع القراءة والورد على جهازك.",
      },
    ],
    links: [{ rel: "canonical", href: "https://waha.hajdah.com/quran" }],
  }),
  component: Quran,
});
function Quran() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [surah, setSurah] = useState<Surah | null>(null);
  const [reader, setReader] = useState(0);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [position, setPosition] = useState<{ surah: number; ayah: number } | null>(null);
  const [active, setActive] = useState(search.ayah);
  const [goal, setGoal] = useState(10);
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [audioError, setAudioError] = useState(false);
  useEffect(() => {
    try {
      setPosition(validPosition(JSON.parse(localStorage.getItem("waha-quran-position") ?? "null")));
      const stored = JSON.parse(localStorage.getItem("waha-quran-wird") ?? "null");
      if (stored?.day === riyadhDay() && Number.isInteger(stored.count))
        setCount(Math.min(6236, Math.max(0, stored.count)));
      if ([5, 10, 20].includes(stored?.goal)) setGoal(stored.goal);
    } catch {
      /* local storage optional */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setSurah(null);
    setAudioError(false);
    fetch(`/quran/${search.surah}.json`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((s: Surah) => {
        setSurah(s);
        const a = Math.min(search.ayah, s.ayahs.length);
        setActive(a);
        setTimeout(
          () => document.getElementById(`ayah-${a}`)?.scrollIntoView({ block: "center" }),
          100,
        );
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("تعذّر تحميل السورة. أعد المحاولة عند توفر الاتصال.");
      });
    return () => controller.abort();
  }, [search.surah, search.ayah, retry]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("waha-quran-wird", JSON.stringify({ day: riyadhDay(), goal, count }));
    } catch {
      setNotice("تعذّر حفظ الورد على الجهاز.");
    }
  }, [ready, goal, count]);
  function save(ayah: number) {
    const p = { surah: search.surah, ayah };
    setActive(ayah);
    setPosition(p);
    try {
      localStorage.setItem("waha-quran-position", JSON.stringify(p));
      setNotice("حُفظ موضع القراءة على هذا الجهاز.");
    } catch {
      setNotice("تعذّر حفظ الموضع على الجهاز.");
    }
  }
  return (
    <div className="mx-auto max-w-3xl space-y-5" dir="rtl">
      <h1 className="font-display text-3xl">القرآن الكريم</h1>
      <p className="text-sm text-muted">
        النص العثماني من AlQuran Cloud · التلاوة من MP3Quran · الحفظ على جهازك.
      </p>
      <div className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-lg font-semibold">ورد اليوم</h2>
        <label htmlFor="wird-goal">هدفي اليومي </label>
        <select
          id="wird-goal"
          className="min-h-11 rounded-lg border border-border bg-bg px-3"
          value={goal}
          onChange={(e) => setGoal(Number(e.target.value))}
        >
          {[5, 10, 20].map((n) => (
            <option key={n} value={n}>
              {n} آيات
            </option>
          ))}
        </select>
        <p className="my-3" role="status">
          {count} / {goal} آيات {count >= goal ? "· أتممت هدفك اليوم، تقبّل الله منك." : ""}
        </p>
        <button className={featureButton} onClick={() => setCount((c) => Math.min(c + 1, 6236))}>
          قرأت آية +
        </button>
        <p className="mt-2 text-xs text-muted">
          عداد يدوي يُصفّر بتوقيت الرياض كل يوم؛ لا يتتبع قراءتك تلقائيًا.
        </p>
        {position && (
          <button
            className={`${featureButton} mt-3`}
            onClick={() => {
              void navigate({ search: { surah: position.surah, ayah: position.ayah } });
            }}
          >
            متابعة آخر موضع · {surahs[position.surah - 1].name}، آية {position.ayah}
          </button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="surah-select" className="mb-2 block">
            السورة
          </label>
          <select
            id="surah-select"
            className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-base"
            value={search.surah}
            onChange={(e) => {
              void navigate({ search: { surah: Number(e.target.value), ayah: 1 } });
            }}
          >
            {surahs.map((s) => (
              <option value={s.number} key={s.number}>
                {s.number}. {s.name} ({s.count} آية)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="reciter-select" className="mb-2 block">
            القارئ · حفص عن عاصم
          </label>
          <select
            id="reciter-select"
            className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-base"
            value={reader}
            onChange={(e) => {
              setReader(Number(e.target.value));
              setAudioError(false);
            }}
          >
            {reciters.map((r, i) => (
              <option value={i} key={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <audio
        key={`${reader}-${search.surah}`}
        controls
        preload="none"
        className="w-full"
        aria-label="تلاوة السورة"
        src={`${reciters[reader].server}${String(search.surah).padStart(3, "0")}.mp3`}
        onError={() => setAudioError(true)}
      />
      {audioError && <p role="status">تعذّر تشغيل التلاوة. تحقق من الاتصال أو اختر قارئًا آخر.</p>}
      {error ? (
        <div role="alert">
          {error}
          <button className={featureButton} onClick={() => setRetry((r) => r + 1)}>
            إعادة المحاولة
          </button>
        </div>
      ) : !surah ? (
        <p role="status">جارٍ تحميل السورة…</p>
      ) : (
        <section
          className="rounded-2xl border border-border bg-surface p-4 sm:p-7"
          aria-label={surah.name}
        >
          <h2 className="mb-5 text-center font-display text-3xl">{surah.name}</h2>
          {surah.ayahs.map((a) => (
            <div
              key={a.number}
              id={`ayah-${a.number}`}
              className={`scroll-mt-20 rounded-xl p-3 ${active === a.number ? "bg-primary/5" : ""}`}
            >
              <p className="font-display text-2xl leading-[2.4]">
                {a.text} <span className="text-primary">﴿{a.number}﴾</span>
              </p>
              <button
                className="min-h-11 min-w-11 px-3 text-sm text-primary"
                aria-pressed={active === a.number}
                onClick={() => save(a.number)}
              >
                حفظ الموضع · {a.number}
              </button>
            </div>
          ))}
        </section>
      )}
      <p role="status" className="text-sm text-muted">
        {notice}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/ask"
          search={{
            q: `أريد تفسيرًا مبسطًا للآية ${active} من ${surahs[search.surah - 1].name} مع ذكر مصدر التفسير والتنبيه للرجوع لأهل العلم.`,
          }}
          className={featureButton}
        >
          اسأل محسن عن التفسير
        </Link>
        <button
          className={featureButton}
          onClick={() => {
            const text = surah?.ayahs.find((a) => a.number === active)?.text ?? "";
            void shareCard(
              `${surahs[search.surah - 1].name} · ${active}`,
              text,
              `${location.origin}/quran?surah=${search.surah}&ayah=${active}`,
            )
              .then(() => setNotice("تمت المشاركة أو نسخ البطاقة."))
              .catch(() => setNotice("لم تتم المشاركة."));
          }}
        >
          مشاركة بطاقة الآية
        </button>
        <ExternalLink href="https://tahajjud.alhajda.com/" className={featureButton}>
          تهجد · للمزيد ↗
        </ExternalLink>
      </div>
      <p className="text-xs text-muted">
        التفسير الآلي قد يخطئ؛ ارجع إلى كتب التفسير الموثوقة وأهل العلم.
      </p>
    </div>
  );
}
