import type { Lang } from "@/lib/i18n";
import { worldStripCards, type WorldCard } from "@/lib/square/world";
import { WorldBadge } from "./world-badge";

export function WorldStrip({
  lang,
  cards,
  active,
  onOpenLane,
}: {
  lang: Lang;
  cards: WorldCard[];
  active?: boolean;
  onOpenLane: () => void;
}) {
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  if (cards.length === 0) return null;
  const preview = worldStripCards(6);

  return (
    <section data-world-strip className="mt-3 rounded-lg border border-border bg-surface px-3 py-3">
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="text-sm font-medium">{L("من العالم", "From the world")}</h2>
          <WorldBadge />
        </div>
        {active ? null : (
          <button type="button" onClick={onOpenLane} className="shrink-0 text-xs text-primary hover:underline">
            {L("الكل", "All")}
          </button>
        )}
      </header>
      {active ? null : (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {preview.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={onOpenLane}
              className="w-52 shrink-0 rounded-md border border-border/80 bg-bg/40 px-3 py-2 text-start hover:bg-surface-2"
            >
              <p className="line-clamp-2 whitespace-pre-line text-xs leading-relaxed text-fg/90">{card.titleOrHook}</p>
              <p className="mt-1 text-[10px] text-subtle">{card.sourceLabel}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
