import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import midad from "@/lib/books/platform/midad.json";
import { listDrafts, deleteDraft } from "@/lib/books/platform/local";
import { summarize, type BookSummary } from "@/lib/books/platform/model";
const button = "min-h-11 rounded-lg border border-border px-4 text-sm";
export function ReadingShelf() {
  const [drafts, setDrafts] = useState<BookSummary[]>([]);
  const [published, setPublished] = useState<BookSummary[]>([]);
  const [error, setError] = useState("");
  const [age, setAge] = useState("الكل");
  const [writer, setWriter] = useState("الكل");
  const [tab, setTab] = useState("المكتبة");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [daily, setDaily] = useState(0);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    void listDrafts()
      .then((items) => {
        if (active) setDrafts(items.map(summarize));
      })
      .catch(() => {
        if (active) setError("تعذّر فتح المسودات المحلية؛ تحقق من إذن التخزين.");
      });
    void fetch("/api/books")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (active) setPublished(data.books);
      })
      .catch(() => {
        if (active) setError("تعذّر تحميل الكتب العامة المضافة. أعد المحاولة.");
      });
    try {
      const s = JSON.parse(localStorage.getItem("waha:reading-shelf") || "[]");
      if (Array.isArray(s)) setSaved(s.filter((id): id is string => typeof id === "string"));
    } catch {
      /* storage optional */
    }
    setDaily(Math.floor(Date.now() / 86400000) % midad.length);
    return () => {
      active = false;
    };
  }, [revision]);
  const all: BookSummary[] = [...drafts, ...published, ...midad];
  const visible = all.filter(
    (b) =>
      (age === "الكل" || b.audience === age) &&
      (writer === "الكل" || b.author === writer) &&
      (tab !== "رفّي" || saved.includes(b.id) || b.id.startsWith("draft-")) &&
      `${b.title} ${b.author} ${b.category}`.includes(query),
  );
  function toggle(id: string) {
    const next = saved.includes(id) ? saved.filter((v) => v !== id) : [...saved, id];
    try {
      localStorage.setItem("waha:reading-shelf", JSON.stringify(next));
      setSaved(next);
    } catch {
      setError("تعذّر حفظ الرف على الجهاز.");
    }
  }
  return (
    <section
      className="mb-10 min-w-0"
      dir="rtl"
      aria-labelledby="reading-library-title"
      data-reading-platform="v1"
    >
      <div className="rounded-2xl border border-primary/25 bg-surface p-5">
        <p className="text-sm text-primary">مداد · بيت القراءة داخل واحة</p>
        <h2 id="reading-library-title" className="mt-2 font-display text-3xl">
          معرفة تُقرأ كما تُعاش
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          نصوص البيت الأصلية، لكل عمر. اقرأ هنا، كبّر الخط، وعُد إلى موضعك. كتّاب البيت: هدى المنيف،
          مازن الدوسري، أميمة الحارثي.
        </p>
        <Link
          to="/studio"
          className="mt-3 inline-flex min-h-11 items-center text-sm text-primary underline"
        >
          إضافة كتاب من الاستوديو
        </Link>
      </div>
      <div className="mt-5 flex flex-wrap gap-2" aria-label="عرض المكتبة">
        {["المكتبة", "رفّي", "معرفة اليوم", "مسارات"].map((v) => (
          <button key={v} className={button} aria-pressed={tab === v} onClick={() => setTab(v)}>
            {v}
          </button>
        ))}
      </div>
      {tab === "معرفة اليوم" ? (
        <div className="mt-4 rounded-xl border border-border p-5">
          <p className="text-sm text-muted">قراءة اليوم من نصوص البيت</p>
          <Link
            className="mt-2 flex min-h-11 items-center text-xl text-primary"
            to="/books/library/$id"
            params={{ id: midad[daily].id }}
          >
            {midad[daily].title}
          </Link>
        </div>
      ) : tab === "مسارات" ? (
        <div className="mt-4 grid gap-3">
          {["أطفال", "يافعون", "شباب", "كبار"].map((v) => (
            <button
              key={v}
              className={`${button} p-4 text-start`}
              onClick={() => {
                setAge(v);
                setTab("المكتبة");
              }}
            >
              مسار {v} · ثلاث قراءات من البيت
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-sm">
              بحث
              <input
                className="mt-1 min-h-11 w-full min-w-0 rounded-lg border border-border bg-surface px-3"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label className="text-sm">
              العمر
              <select
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-surface px-3"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              >
                {["الكل", "الجميع", "أطفال", "يافعون", "شباب", "كبار"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              المؤلف
              <select
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-surface px-3"
                value={writer}
                onChange={(e) => setWriter(e.target.value)}
              >
                {["الكل", ...new Set(all.map((b) => b.author))].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {visible.map((b) => (
              <article
                key={b.id}
                className="min-w-0 rounded-xl border border-border bg-surface p-4 [overflow-wrap:anywhere]"
                data-platform-book={b.id}
              >
                {b.cover ? (
                  <img
                    src={b.cover}
                    alt={`غلاف ${b.title}`}
                    loading="lazy"
                    className="mb-3 h-32 max-w-full rounded-lg object-contain"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="mb-3 flex h-24 items-center justify-center rounded-lg bg-primary/10 px-4 font-display text-xl text-primary"
                  >
                    {b.category} · {b.audience}
                  </div>
                )}
                <p className="text-xs text-muted">
                  {b.id.startsWith("draft-")
                    ? "مسودة محلية · على هذا الجهاز"
                    : b.source || "كتاب أضافه المالك"}
                </p>
                <h3 className="mt-2 font-display text-2xl">{b.title}</h3>
                <p className="mt-1 text-sm text-muted">
                  {b.author} · {b.chapterCount} فصول
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to="/books/library/$id"
                    params={{ id: b.id }}
                    className={`${button} inline-flex items-center bg-primary text-primary-fg`}
                  >
                    اقرأ الكتاب
                  </Link>
                  <button
                    className={button}
                    aria-pressed={saved.includes(b.id)}
                    onClick={() => toggle(b.id)}
                  >
                    {saved.includes(b.id) ? "إزالة من رفّي" : "أضف إلى رفّي"}
                  </button>
                  {b.id.startsWith("draft-") && (
                    <button
                      className={button}
                      onClick={() => {
                        if (window.confirm("حذف المسودة المحلية نهائيًا؟"))
                          void deleteDraft(b.id)
                            .then(() => setRevision((r) => r + 1))
                            .catch(() => setError("تعذّر حذف المسودة."));
                      }}
                    >
                      حذف المسودة
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
          {!visible.length && (
            <p className="mt-4 text-sm text-muted">لا توجد كتب تطابق الاختيار.</p>
          )}
        </>
      )}
      {error && (
        <p role="status" className="mt-4 text-sm text-muted">
          {error}
          <button
            className={`${button} ms-2`}
            onClick={() => {
              setError("");
              setRevision((v) => v + 1);
            }}
          >
            إعادة المحاولة
          </button>
        </p>
      )}
    </section>
  );
}
