import { ExternalLink } from "@/components/external-link";
import type { Lang } from "@/lib/i18n";
import { PALETTE } from "@/lib/palette";
import type { XCard as XCardRow } from "@/lib/x";
import { XBadge } from "./x-badge";

export function XCard({ card, lang }: { card: XCardRow; lang: Lang }) {
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <article
      data-x-card={card.id}
      data-x-tamyiz="slip"
      className="w-[19.5rem] shrink-0 snap-start rounded-md bg-bg/30 px-3 py-3"
    >
      <div className="flex gap-3">
        <span
          className="mt-1 w-px shrink-0 self-stretch"
          style={{ background: PALETTE.primary }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <header className="min-w-0">
            <XBadge />
            <p className="mt-1 text-[13px] leading-snug text-fg">{card.authorName}</p>
            <p className="mt-0.5 text-[11px] text-subtle" dir="ltr">
              {card.authorHandle}
            </p>
          </header>
          <p className="mt-2.5 whitespace-pre-line text-[15px] leading-relaxed text-fg">{card.text}</p>
          <ExternalLink
            href={card.sourceUrl}
            data-x-source={card.whitelistId}
            className="mt-3 block text-[11px] leading-relaxed hover:underline"
          >
            <span className="text-subtle">{L("الأصل", "Original")}</span>
            <span className="mt-0.5 block break-all text-primary">{card.sourceUrl}</span>
          </ExternalLink>
        </div>
      </div>
    </article>
  );
}
