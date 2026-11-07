import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { continueReading, type ContinueHit } from "@/lib/books/continue-reading";

/** Library-only resume. It does not add or reorder homepage widgets. */
export function ContinueReading() {
  const [hits, setHits] = useState<ContinueHit[]>([]);
  useEffect(() => {
    setHits(continueReading(localStorage));
  }, []);
  if (!hits.length) return null;
  return <ContinueList hits={hits} />;
}

function ResumeLink({ item }: { item: ContinueHit }) {
  const className = "flex min-h-11 flex-col justify-center py-1 text-primary";
  const body = (
    <>
      <span className="font-medium">{item.title}</span>
      <span className="text-sm text-muted">{item.detail}</span>
    </>
  );
  if (item.href.startsWith("/books/stories/"))
    return (
      <Link to="/books/stories/$slug" params={{ slug: item.href.slice("/books/stories/".length) }} className={className}>
        {body}
      </Link>
    );
  if (item.href.startsWith("/books/library/"))
    return (
      <Link to="/books/library/$id" params={{ id: item.href.slice("/books/library/".length) }} className={className}>
        {body}
      </Link>
    );
  if (item.href === "/books/trading-guide")
    return (
      <Link to="/books/trading-guide" className={className}>
        {body}
      </Link>
    );
  return (
    <Link to="/books/alhajda" className={className}>
      {body}
    </Link>
  );
}

function ContinueList({ hits }: { hits: ContinueHit[] }) {
  return (
    <section className="mb-8 rounded-2xl border border-border bg-surface p-5" aria-label="أكمل القراءة">
      <h2 className="font-display text-2xl">أكمل القراءة</h2>
      <p className="mt-1 text-sm text-muted">من الموضع المحفوظ على هذا الجهاز.</p>
      <ul className="mt-3 space-y-2">
        {hits.map((item) => (
          <li key={item.href}>
            <ResumeLink item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}
