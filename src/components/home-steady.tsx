import { Link } from "@tanstack/react-router";
import type { ContinueHit } from "@/lib/books/continue-reading";
import type { MidadCard } from "@/lib/home-steady";

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

export function HomeContinue({ items }: { items: ContinueHit[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-label="أكمل القراءة" data-home-widget="continue" className="waha-card">
      <h2 className="text-lg">أكمل القراءة</h2>
      <ul className="mt-2">
        {items.map((item) => (
          <li key={item.href}>
            <Open item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HomeSaved({ items }: { items: ContinueHit[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-label="محفوظاتك" data-home-widget="saved" className="waha-card">
      <h2 className="text-lg">محفوظاتك</h2>
      <ul className="mt-2">
        {items.map((item) => (
          <li key={item.href}>
            <Open item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HomePicks({ books }: { books: MidadCard[] }) {
  if (books.length === 0) return null;
  return (
    <section aria-label="كتب من مداد" data-home-widget="picks" className="waha-card tint-sand">
      <h2 className="text-lg">كتب من مداد</h2>
      <p className="text-sm text-muted">ترتيب الفهرس ثابت. كل بطاقة كتاب غير المعروض أعلاه.</p>
      <ul className="mt-2">
        {books.map((book) => (
          <li key={book.id}>
            <Link to="/books/library/$id" params={{ id: book.id }} className={row}>
              <span className="block font-medium">{book.title}</span>
              <span className="block text-sm text-muted">
                {book.author} · {book.category} · {book.audience}
              </span>
              <span className="block text-sm text-muted">{book.source}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
