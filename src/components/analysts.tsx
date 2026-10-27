import { useEffect, useState } from "react";
import { ExternalLink } from "./external-link";
type Analyst = {
  handle: string;
  name: string;
  ini: string;
  color: string;
  role?: string;
  url?: string;
};
type Opinion = {
  id: number;
  handle: string;
  summary: string;
  title: string;
  url: string;
  posted_at: string;
  analyst: Analyst;
};
export function Analysts({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<{ items: Opinion[]; roster: Analyst[] } | null>(null),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const ctl = new AbortController();
    setError(false);
    fetch("/api/analysts", { signal: ctl.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => {
        if (!ctl.signal.aborted) setError(true);
      });
    return () => ctl.abort();
  }, [retry]);
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl">من آراء المحللين</h2>
      <p className="text-xs leading-6 text-muted">
        من هدوء السوق · آراء أصحابها بتاريخ النشر، لا توصيات استثمارية.
      </p>
      {error ? (
        <div role="status">
          تعذّر تحميل الآراء.{" "}
          <button className="min-h-11 px-3 underline" onClick={() => setRetry((n) => n + 1)}>
            إعادة المحاولة
          </button>
        </div>
      ) : !data ? (
        <p role="status">جارٍ تحميل المحللين…</p>
      ) : (
        <>
          {data.items.slice(0, compact ? 1 : 12).map((item) => (
            <article key={item.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <span
                  style={{
                    backgroundColor: /^#[a-f\d]{6}$/i.test(item.analyst.color)
                      ? item.analyst.color
                      : "#0f766e",
                  }}
                  className="grid size-11 shrink-0 place-items-center rounded-full text-sm text-white"
                >
                  {item.analyst.ini}
                </span>
                <strong>{item.analyst.name}</strong>
              </div>
              <p className="mt-3 text-sm leading-7">{compact ? item.title : item.summary}</p>
              {!compact && <time className="text-xs text-muted">{item.posted_at}</time>}
              <ExternalLink
                direct
                href={item.url}
                className="mt-2 flex min-h-11 items-center text-sm text-primary underline"
              >
                التغريدة الأصلية ↗
              </ExternalLink>
            </article>
          ))}
          {!compact && (
            <details>
              <summary className="min-h-11 content-center">
                دليل المحللين ({data.roster.length})
              </summary>
              {data.roster.map((a) => (
                <ExternalLink
                  direct
                  key={a.handle}
                  href={a.url || `https://news.alhajda.com/analysts/${a.handle}`}
                  className="block min-h-11 content-center py-2"
                >
                  {a.name} · {a.role}
                </ExternalLink>
              ))}
            </details>
          )}
        </>
      )}
      <ExternalLink
        direct
        href="https://news.alhajda.com/analysts"
        className="flex min-h-11 items-center text-sm text-primary"
      >
        كل آراء المحللين ↗
      </ExternalLink>
    </section>
  );
}
