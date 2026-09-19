import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { CatalogItem } from "@/lib/catalog";
import { appIcon } from "@/lib/icons";
import { t, type Lang } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/catalog";
import { cn } from "@/lib/cn";

export function AppStage({
  item,
  lang,
  children,
  wide = false,
  compact = false,
}: {
  item: CatalogItem;
  lang: Lang;
  children: React.ReactNode;
  wide?: boolean;
  compact?: boolean;
}) {
  const Icon = appIcon(item.icon);
  const hub = CATEGORIES.find((c) => c.id === item.category)?.path ?? "/";
  return (
    <div className={cn("mx-auto w-full", wide ? "max-w-5xl" : "max-w-3xl")}>
      <Link
        to={hub}
        className={cn(
          "inline-flex items-center gap-2 text-sm text-muted hover:text-fg",
          compact ? "mb-3" : "mb-6",
        )}
      >
        <ArrowRight className="size-4 rtl:rotate-0 ltr:rotate-180" />
        {t(lang, "back")}
      </Link>
      <div className={cn("flex items-start gap-3", compact ? "mb-3" : "mb-6")}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-2 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-medium tracking-tight">{item.title[lang]}</h1>
          <p className="mt-1 text-sm text-muted">{item.blurb[lang]}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 font-mono text-lg tabular-nums text-fg">{value}</div>
    </div>
  );
}
