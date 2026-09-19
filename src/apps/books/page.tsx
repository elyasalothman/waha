import { Link } from "@tanstack/react-router";
import { BooksMark } from "@/components/brand";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  accountOwnsKutubi,
  useBooks,
  useKutubi,
  type BookCard,
  type BookUiSection,
} from "@/lib/books";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

const SECTION_EN: Record<BookUiSection, string> = {
  أخلاق: "Akhlaq",
  شرعي: "Sharia",
  مداد: "Midad",
};

export function BooksPage() {
  const lang = useAppStore((s) => s.lang);
  const sliceChosen = useAppStore((s) => s.sliceChosen);
  const { sections, local, markOpened } = useBooks();
  const kutubi = useKutubi();
  const { user, isPending } = useCurrentUserState();
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const hasAccount = accountOwnsKutubi({
    sliceChosen,
    signedInRealUser: !isPending && Boolean(user && !user.isDevFallback),
  });

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

      {hasAccount ? (
        <section className="mb-10" data-kutubi="local-v1" data-kutubi-publish="never" data-kutubi-scope="account">
          <h2 className="font-display text-2xl tracking-tight">{t(lang, "kutubi")}</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">{t(lang, "kutubiBlurb")}</p>
          {kutubi.books.length === 0 ? (
            <p className="mt-4 text-sm text-subtle" data-kutubi-empty="true">
              {t(lang, "kutubiEmpty")}
            </p>
          ) : (
            <ol className="mt-4 grid gap-3">
              {kutubi.books.map((book) => {
                const draft = kutubi.local.items.find((item) => item.bookId === book.id)?.publicDraft;
                return (
                  <li key={`kutubi-${book.id}`}>
                    <BookCardView
                      book={book}
                      lang={lang}
                      opened={local.opened.includes(book.id)}
                      openLabel={t(lang, "booksOpen")}
                      onOpen={() => markOpened(book.id)}
                      kutubiAction={{
                        label: t(lang, "kutubiRemove"),
                        onClick: () => kutubi.remove(book.id),
                      }}
                      publicDraft={{
                        pending: Boolean(draft),
                        label: draft ? t(lang, "kutubiPublicDraft") : t(lang, "kutubiOfferPublic"),
                        onClick: draft ? () => undefined : () => kutubi.requestPublic(book.id),
                      }}
                    />
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      ) : (
        <p className="mb-8 text-sm text-subtle" data-kutubi-guest="public-only">
          {t(lang, "kutubiGuestHint")}{" "}
          <Link to="/onboarding" className="text-primary hover:underline">
            {t(lang, "createAccount")}
          </Link>
        </p>
      )}

      <div className="grid gap-10" data-books-public="council-shelf">
        {sections.map((group) => (
          <section key={group.section} data-books-section={group.section}>
            <h2 className="font-display text-2xl tracking-tight">{L(group.section, SECTION_EN[group.section])}</h2>
            <ol className="mt-4 grid gap-3">
              {group.books.map((book) => {
                const saved = kutubi.local.items.some((item) => item.bookId === book.id);
                return (
                  <li key={book.id}>
                    <BookCardView
                      book={book}
                      lang={lang}
                      opened={local.opened.includes(book.id)}
                      openLabel={t(lang, "booksOpen")}
                      onOpen={() => markOpened(book.id)}
                      kutubiAction={
                        hasAccount
                          ? {
                              label: saved ? t(lang, "kutubiSaved") : t(lang, "kutubiAdd"),
                              onClick: saved ? () => undefined : () => kutubi.add(book.id),
                              done: saved,
                            }
                          : undefined
                      }
                    />
                  </li>
                );
              })}
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
  kutubiAction,
  publicDraft,
}: {
  book: BookCard;
  lang: "ar" | "en";
  opened: boolean;
  openLabel: string;
  onOpen: () => void;
  kutubiAction?: { label: string; onClick: () => void; done?: boolean };
  publicDraft?: { pending: boolean; label: string; onClick: () => void };
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
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <a
          href={book.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center text-sm text-primary hover:underline"
          data-original-link="marked-source"
          onClick={onOpen}
        >
          <span>{openLabel}</span>
          <span className="ms-2 font-mono text-xs text-subtle" dir="ltr">
            {book.url}
          </span>
        </a>
        {kutubiAction ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center text-sm text-muted hover:text-primary disabled:opacity-60"
            data-kutubi-action={kutubiAction.done ? "saved" : "add-or-remove"}
            disabled={kutubiAction.done}
            onClick={kutubiAction.onClick}
          >
            {kutubiAction.label}
          </button>
        ) : null}
        {publicDraft ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center text-sm text-muted hover:text-primary disabled:opacity-60"
            data-kutubi-draft={publicDraft.pending ? "legal-review" : "offer"}
            disabled={publicDraft.pending}
            onClick={publicDraft.onClick}
          >
            {publicDraft.label}
          </button>
        ) : null}
      </div>
    </article>
  );
}
