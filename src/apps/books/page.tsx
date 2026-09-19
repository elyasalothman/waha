import { BooksMark } from "@/components/brand";
import { useBooks, type BookCard, type BookUiSection } from "@/lib/books";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

const SECTION_EN: Record<BookUiSection, string> = {
  أخلاق: "Akhlaq",
  شرعي: "Sharia",
  مداد: "Midad",
};

export function BooksPage() {
  const lang = useAppStore((s) => s.lang);
  const { sections, local, markOpened } = useBooks();
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <div className="mx-auto max-w-2xl" data-books-lane="shelf-v1">
      <header className="mb-8">
        <p className="flex items-center gap-2 text-sm text-primary">
          <BooksMark className="size-5" />
          {t(lang, "books")}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{t(lang, "booksTitle")}</h1>
        <p className="mt-2 max-w-xl text-muted">{t(lang, "booksBlurb")}</p>
      </header>

      <div className="grid gap-10">
        {sections.map((group) => (
          <section key={group.section} data-books-section={group.section}>
            <h2 className="font-display text-2xl tracking-tight">{L(group.section, SECTION_EN[group.section])}</h2>
            <ol className="mt-4 grid gap-3">
              {group.books.map((book) => (
                <li key={book.id}>
                  <BookCardView
                    book={book}
                    lang={lang}
                    opened={local.opened.includes(book.id)}
                    openLabel={t(lang, "booksOpen")}
                    onOpen={() => markOpened(book.id)}
                  />
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

function BookCardView({
  book,
  lang,
  opened,
  openLabel,
  onOpen,
}: {
  book: BookCard;
  lang: "ar" | "en";
  opened: boolean;
  openLabel: string;
  onOpen: () => void;
}) {
  return (
    <article
      className="rounded-xl border border-border bg-surface p-4 shadow-(--shadow-soft)"
      data-book-id={book.id}
      data-on-maydan="false"
      data-paper-purchase="false"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-subtle">
        <span
          className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary"
          data-book-stamp="visible"
        >
          {book.stamp}
        </span>
        <span className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-muted">{book.sourceLabel}</span>
        {opened ? <span className="text-primary">{lang === "ar" ? "فُتح" : "Opened"}</span> : null}
      </div>
      <h3 className="mt-2 font-display text-2xl tracking-tight">{book.titleAr}</h3>
      <p className="mt-1 text-sm text-muted">{book.author}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{book.benefitAr}</p>
      <p className="mt-2 text-xs leading-relaxed text-subtle">{book.legalNote}</p>
      <a
        href={book.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex min-h-11 items-center text-sm text-primary hover:underline"
        data-original-link="marked-source"
        onClick={onOpen}
      >
        <span>{openLabel}</span>
        <span className="ms-2 font-mono text-xs text-subtle" dir="ltr">
          {book.url}
        </span>
      </a>
    </article>
  );
}
