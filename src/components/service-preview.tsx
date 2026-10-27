import { useEffect, useState } from "react";
import { ExternalLink } from "./external-link";
type Item = {
  id: string;
  title: string;
  detail: string;
  href: string;
  fields?: Record<string, number | null>;
  source?: string;
};
export function ServicePreview({
  id,
  initialQuery = "السعودية",
}: {
  id: string;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery),
    [term, setTerm] = useState(initialQuery),
    [data, setData] = useState<Item[] | null>(null),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0),
    [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    if (!["wiki", "phones", "bench"].includes(id)) return;
    const ctl = new AbortController();
    setData(null);
    setError(false);
    fetch(`/api/service-data?id=${id}&q=${encodeURIComponent(term)}`, { signal: ctl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (d.status !== "live") throw new Error();
        setData(d.items);
      })
      .catch(() => {
        if (!ctl.signal.aborted) setError(true);
      });
    return () => ctl.abort();
  }, [id, term, retry]);
  if (!["wiki", "phones", "bench"].includes(id)) return null;
  const choices = (data || []).filter((i) => selected.includes(i.id));
  return (
    <section className="space-y-3 border-t border-border pt-4">
      <h2 className="font-display text-xl">
        {id === "wiki"
          ? "ابحث في الموسوعة"
          : id === "phones"
            ? "قارن جوالين هنا"
            : "نتائج المقياس العربي"}
      </h2>
      {id === "wiki" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTerm(query);
          }}
          className="flex flex-wrap gap-2"
        >
          <label className="min-w-0 flex-1">
            موضوع البحث
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={120}
              className="mt-1 min-h-11 w-full rounded-xl border border-border bg-bg px-3"
            />
          </label>
          <button className="min-h-11 self-end rounded-xl border border-border px-4">بحث</button>
        </form>
      )}
      {id === "bench" && (
        <p className="text-sm leading-7 text-muted">
          هذه نتائج مجموعة اختبار محدودة من مقياس الهجدة؛ ليست ضمانًا لجودة كل إجابة. راجع المنهجية
          وتاريخ القياس. البيانات مرخّصة CC BY 4.0 من مقياس الهجدة.
        </p>
      )}
      {error ? (
        <p role="status">
          تعذّر جلب المصدر.{" "}
          <button onClick={() => setRetry((n) => n + 1)} className="min-h-11 px-3 underline">
            إعادة المحاولة
          </button>{" "}
          أو افتح الموقع الكامل أعلاه.
        </p>
      ) : !data ? (
        <p role="status">جارٍ تحميل المصدر…</p>
      ) : (
        <>
          {id === "phones" ? (
            <>
              <div className="grid gap-3">
                {[0, 1].map((n) => (
                  <label key={n}>
                    الجوال {n + 1}
                    <select
                      aria-label={`الجوال ${n + 1}`}
                      className="mt-1 min-h-12 w-full min-w-0 rounded-xl border border-border bg-bg px-3"
                      value={selected[n] || ""}
                      onChange={(e) =>
                        setSelected((s) => {
                          const next = [...s];
                          next[n] = e.target.value;
                          return next;
                        })
                      }
                    >
                      <option value="">اختر جهازًا</option>
                      {data.map((d) => (
                        <option key={d.id} value={d.id} disabled={d.id === selected[1 - n]}>
                          {d.title}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              {choices.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {choices.map((d) => (
                    <article key={d.id} className="min-w-0 rounded-xl border border-border p-3">
                      <h3 className="break-words font-bold">{d.title}</h3>
                      <p className="my-2 break-words text-xs">{d.detail}</p>
                      {Object.entries(d.fields || {}).map(([k, v]) => (
                        <p key={k} className="my-2 text-sm">
                          {k}: {v ?? "لم يُختبر بعد"}
                        </p>
                      ))}
                      <ExternalLink
                        direct
                        href={d.source || d.href}
                        className="flex min-h-11 items-center text-sm text-primary underline"
                      >
                        مصدر المواصفات ↗
                      </ExternalLink>
                      <ExternalLink
                        direct
                        href={d.href}
                        className="flex min-h-11 items-center text-sm text-primary underline"
                      >
                        الأسعار والتفاصيل ↗
                      </ExternalLink>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              {data.map((d) => (
                <article key={d.id} className="rounded-xl border border-border p-3">
                  <h3 className="font-bold">{d.title}</h3>
                  <p className="mt-2 text-sm leading-7">{d.detail}</p>
                  <ExternalLink
                    direct
                    href={d.href}
                    className="flex min-h-11 items-center text-primary underline"
                  >
                    {id === "wiki" ? "المقال ومصادره" : "منهجية القياس"} ↗
                  </ExternalLink>
                </article>
              ))}
              {!data.length && <p role="status">لا توجد نتائج لهذا البحث.</p>}
            </div>
          )}
        </>
      )}
    </section>
  );
}
