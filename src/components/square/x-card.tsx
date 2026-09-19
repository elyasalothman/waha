import { ExternalLink } from "@/components/external-link";
import type { Lang } from "@/lib/i18n";
import type { XCard as XCardRow } from "@/lib/x";
import { XBadge } from "./x-badge";

export function XCard({ card, lang }: { card: XCardRow; lang: Lang }) {
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <article
      data-x-card={card.id}
      className="w-72 shrink-0 rounded-md border border-border/80 bg-bg/40 px-3 py-2.5"
    >
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <XBadge />
        <p className="min-w-0 text-[11px] text-muted">
          <span className="text-fg/90">{card.authorName}</span>{" "}
          <span dir="ltr">{card.authorHandle}</span>
        </p>
      </header>
      <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-fg/90">{card.text}</p>
      <ExternalLink
        href={card.sourceUrl}
        data-x-source={card.whitelistId}
        className="mt-2 block break-all text-[11px] text-primary hover:underline"
      >
        {card.sourceUrl}
      </ExternalLink>
      <p className="sr-only">{L("رابط أصلي", "Original link")}</p>
    </article>
  );
}
