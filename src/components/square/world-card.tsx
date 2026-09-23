import type { Lang } from "@/lib/i18n";
import { sourceKindLabel, type WorldCard as WorldCardRow } from "@/lib/square/world";
import { WorldBadge } from "./world-badge";

export function WorldCard({ card, lang }: { card: WorldCardRow; lang: Lang }) {
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <article data-world-card={card.id} className="border-b border-border px-1 py-4">
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <WorldBadge />
        <a
          href={card.sourceUrl}
          target="_blank"
          rel="noreferrer"
          data-world-source={card.sourceId}
          className="text-xs text-muted hover:text-fg hover:underline"
        >
          {sourceKindLabel(card.sourceKind, lang)} · {card.sourceLabel}
        </a>
      </header>
      <h3 className="mt-2 whitespace-pre-line text-[15px] font-medium leading-relaxed text-fg">{card.titleOrHook}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-fg/80">{card.summary}</p>
      <p className="mt-2 text-[11px] text-subtle">{L("بذرة ثابتة", "Static seed")}</p>
    </article>
  );
}
