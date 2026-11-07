import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExternalLink } from "./external-link";
import { continueReading, savedReading, type ContinueHit } from "@/lib/books/continue-reading";
import { steadyBooks, steadyResearch } from "@/lib/home-steady";

const row =
  "block min-h-11 rounded-xl py-2 focus-visible:outline-2 focus-visible:outline-offset-2";

function Open({ item }: { item: ContinueHit }) {
  const body = (
    <>
      <span className="block font-medium">{item.title}</span>
      <span className="block text-sm text-muted">{item.detail}</span>
    </>
  );
  if (item.href.startsWith("/books/stories/"))
    return (
      <Link to="/books/stories/$slug" params={{ slug: item.href.slice("/books/stories/".length) }} className={row}>
        {body}
      </Link>
    );
  if (item.href.startsWith("/books/library/"))
    return (
      <Link to="/books/library/$id" params={{ id: item.href.slice("/books/library/".length) }} className={row}>
        {body}
      </Link>
    );
  if (item.href === "/books/trading-guide")
    return (
      <Link to="/books/trading-guide" className={row}>
        {body}
      </Link>
    );
  return (
    <Link to="/books/alhajda" className={row}>
      {body}
    </Link>
  );
}

/** Fixed home sections. They are not entries in the saved widget list. */
export function HomeSteady({ showResearch }: { showResearch: boolean }) {
  const [resume, setResume] = useState<ContinueHit[]>([]);
  const [saved, setSaved] = useState<ContinueHit[]>([]);
  useEffect(() => {
    const next = continueReading(localStorage);
    const open = new Set(next.map((item) => item.href));
    setResume(next);
    setSaved(savedReading(localStorage).filter((item) => !open.has(item.href)));
  }, []);
  const books = steadyBooks();
  const papers = steadyResearch();
  return (
    <div className="space-y-5" data-home-steady="true">
      {resume.length > 0 ? (
        <section aria-label="أكمل القراءة" className="waha-card">
          <h2 className="text-lg">أكمل القراءة</h2>
          <ul className="mt-2">
            {resume.map((item) => (
              <li key={item.href}>
                <Open item={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {saved.length > 0 ? (
        <section aria-label="محفوظاتك" className="waha-card">
          <h2 className="text-lg">محفوظاتك</h2>
          <ul className="mt-2">
            {saved.map((item) => (
              <li key={item.href}>
                <Open item={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section aria-label="كتب من مداد" className="waha-card tint-sand">
        <h2 className="text-lg">كتب من مداد</h2>
        <p className="text-sm text-muted">اختيار ثابت من نصوص البيت، غير فقرة اليوم.</p>
        <ul className="mt-2">
          {books.map((book) => (
            <li key={book.id}>
              <Link to="/books/library/$id" params={{ id: book.id }} className={row}>
                <span className="block font-medium">{book.title}</span>
                <span className="block text-sm text-muted">
                  {book.author} · {book.category} · {book.audience}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      {showResearch ? (
        <section aria-label="أوراق الأبحاث" className="waha-card tint-sky">
          <h2 className="text-lg">أوراق الأبحاث</h2>
          <p className="text-sm text-muted">الصفحات المنشورة، لا ملخص من عندنا.</p>
          <ul className="mt-2">
            {papers.map((paper) => (
              <li key={paper.id}>
                <ExternalLink direct href={paper.href} className={row}>
                  <span className="block font-medium">{paper.title}</span>
                  <span className="block text-sm text-muted">{paper.note}</span>
                </ExternalLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
