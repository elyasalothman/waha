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
    <section data-x-strip data-x-lane="من إكس" className="mt-3 rounded-lg border border-border bg-surface px-3 py-3">
      <header className="flex min-w-0 flex-wrap items-center gap-2">
        <h2 className="text-sm font-medium">{L("من إكس", "From X")}</h2>
        <XBadge />
      </header>
      <div className="mt-2 flex flex-nowrap gap-2 overflow-x-auto pb-1">
        {preview.map((card) => (
          <XCard key={card.id} card={card} lang={lang} />
        ))}
      </div>
    </section>
  );
}
