import { Link } from "@tanstack/react-router";
import type { CatalogItem } from "@/lib/catalog";
import { appIcon } from "@/lib/icons";
import { t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export function AppCard({ item, lang, large = false }: { item: CatalogItem; lang: Lang; large?: boolean }) {
  const Icon = appIcon(item.icon);
  return (
    <Link
      to="/app/$id"
      params={{ id: item.id }}
      className={cn(
        "group flex flex-col rounded-xl border border-border bg-surface p-4 transition-[background-color,transform] duration-200 ease-out hover:bg-surface-2",
        large && "p-5",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex size-10 items-center justify-center rounded-md bg-surface-2 text-primary">
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        {item.fresh ? <span className="text-[11px] text-subtle">{t(lang, "newBadge")}</span> : null}
      </span>
      <span className="mt-4 font-medium text-fg">{item.title[lang]}</span>
      <span className="mt-1 text-sm leading-relaxed text-muted">{item.blurb[lang]}</span>
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
