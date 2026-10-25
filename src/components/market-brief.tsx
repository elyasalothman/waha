import { useEffect, useState } from "react";
import { PageState, Skeleton } from "./ui/page-state";
type Quote = {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  at: string;
  change: number | null;
  source: string;
};
export function MarketBrief() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetch("/api/market", { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const data = await r.json();
        setQuotes(data.quotes);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [revision]);
  return (
    <section
      className="market-brief space-y-3 rounded-xl border border-border bg-surface p-4"
      aria-label="موجز السوق"
    >
      <h2 className="font-display text-2xl">موجز السوق</h2>
      <p className="text-sm text-muted">
        أسعار مرجعية من منضدة السوق، قد تكون متأخرة. وقت كل سعر ظاهر؛ معلومات بلا توصيات.
      </p>
      <div
        className="market-brief-content"
        role="region"
        aria-label="أسعار السوق، قائمة قابلة للتمرير"
        tabIndex={0}
      >
        {error ? (
          <PageState title="تعذّر تحميل الأسعار" retry={() => setRevision((n) => n + 1)}>
            تحقق من الاتصال ثم أعد المحاولة. لا نعرض أسعارًا بديلة.
          </PageState>
        ) : !quotes.length ? (
          <div role="status" aria-label="جارٍ تحميل السوق" className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="min-h-32 space-y-3 rounded-lg border border-border p-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {quotes.map((q) => (
              <li key={q.symbol} className="min-w-0 rounded-lg border border-border p-3">
                <p>
                  {q.name} · <span dir="ltr">{q.symbol}</span>
                </p>
                <p dir="ltr" className="font-mono">
                  {q.price} {q.currency}{" "}
                  {q.change === null ? "" : `(${q.change > 0 ? "+" : ""}${q.change}%)`}
                </p>
                <p className="break-words text-xs text-muted">
                  المصدر: {q.source} ·{" "}
                  <time dateTime={q.at}>{q.at.replace("T", " ").replace(".000Z", " UTC")}</time>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
