import type { Lang } from "@/lib/i18n";
import { useX, xStripCards } from "@/lib/x";
import { XBadge } from "./x-badge";
import { XCard } from "./x-card";

export function XStrip({ lang }: { lang: Lang }) {
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const { cards } = useX();
  const preview = xStripCards();
  if (cards.length === 0) return null;

  return (
    <section
      data-x-strip
      data-x-lane="من إكس"
      data-x-tamyiz="quiet-v1"
      data-x-live="seed-v1"
      className="mt-3 border-y border-border/80 py-3"
    >
      <header className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 px-0.5">
        <h2 className="font-display text-base tracking-tight">{L("من إكس", "From X")}</h2>
        <XBadge />
      </header>
      <div className="mt-3 flex snap-x snap-mandatory flex-nowrap gap-3 overflow-x-auto pb-1">
        {preview.map((card) => (
          <XCard key={card.id} card={card} lang={lang} />
        ))}
      </div>
    </section>
  );
}
