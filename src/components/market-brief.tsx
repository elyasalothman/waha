import { useEffect, useState } from "react";
import { ExternalLink } from "@/components/external-link";
import { featureButton } from "@/lib/share-card";
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
      className="space-y-3 rounded-xl border border-border bg-surface p-4"
      aria-label="موجز السوق"
    >
      <h2 className="font-display text-2xl">موجز السوق</h2>
      <p className="text-sm text-muted">
        أسعار مرجعية من منضدة السوق، قد تكون متأخرة. وقت كل سعر ظاهر؛ معلومات بلا توصيات.
      </p>
      {error ? (
        <p role="alert">
          تعذّر تحميل الأسعار.{" "}
          <button className={featureButton} onClick={() => setRevision((n) => n + 1)}>
            إعادة المحاولة
          </button>
        </p>
      ) : !quotes.length ? (
        <p role="status">جارٍ تحميل السوق…</p>
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
      <ExternalLink href="https://market.alhajda.com" className={featureButton}>
        افتح الموقع الكامل ↗
      </ExternalLink>
    </section>
  );
}
