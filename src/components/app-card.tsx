import { Link } from "@tanstack/react-router";
import type { CatalogItem } from "@/lib/catalog";
import { BooksMark, ClipsMark, MadarMark } from "@/components/brand";
import { ExternalLink } from "@/components/external-link";
import { appIcon } from "@/lib/icons";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";

function CatalogIcon({ item }: { item: CatalogItem }) {
  if (item.id === "madar") return <MadarMark className="size-5" />;
  if (item.id === "clips") return <ClipsMark className="size-5" />;
  if (item.id === "midad") return <BooksMark className="size-5" />;
  const Icon = appIcon(item.icon);
  return <Icon className="size-5" strokeWidth={1.75} />;
}

function CardBody({ item, lang, large }: { item: CatalogItem; lang: Lang; large?: boolean }) {
  return (
    <>
      <span className="flex items-center justify-between gap-2">
        <span className="flex size-10 items-center justify-center rounded-md bg-surface-2 text-primary">
          <CatalogIcon item={item} />
        </span>
      </span>
      <span className={cn("mt-4 font-medium text-fg", large && "text-lg")}>{item.title[lang]}</span>
      <span className="mt-1 text-sm leading-relaxed text-muted">{item.blurb[lang]}</span>
      {item.href ? (
        <span className="mt-3 font-mono text-xs text-subtle" dir="ltr">
          {new URL(item.href).host}
        </span>
      ) : null}
    </>
  );
}

export function AppCard({ item, lang, large = false }: { item: CatalogItem; lang: Lang; large?: boolean }) {
  const className = cn(
    "group flex flex-col rounded-xl border border-border bg-surface p-4 transition-[background-color,transform] duration-200 ease-out hover:bg-surface-2",
    large && "p-5",
  );

  if (item.portal && item.id === "madar") {
    return (
      <Link to="/madar" className={className}>
        <CardBody item={item} lang={lang} large={large} />
      </Link>
    );
  }

  if (item.portal && item.id === "clips") {
    return (
      <Link to="/clips" className={className}>
        <CardBody item={item} lang={lang} large={large} />
      </Link>
    );
  }

  if (item.portal && item.id === "midad") {
    return (
      <Link to="/books" className={className}>
        <CardBody item={item} lang={lang} large={large} />
      </Link>
    );
  }

  if (item.href) {
    return (
      <ExternalLink href={item.href} className={className}>
        <CardBody item={item} lang={lang} large={large} />
      </ExternalLink>
    );
  }

  return (
    <Link to="/app/$id" params={{ id: item.id }} className={className}>
      <CardBody item={item} lang={lang} large={large} />
    </Link>
  );
}

export function AppGrid({ items, lang }: { items: CatalogItem[]; lang: Lang }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <AppCard key={item.id} item={item} lang={lang} />
      ))}
    </div>
  );
}
