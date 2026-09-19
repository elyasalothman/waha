import { usePersistent } from "@/lib/storage";
import { SUPPORT_CARD_STORAGE_KEY, resolveSupportPath } from "@/lib/square/soft-money";
import type { Lang } from "@/lib/i18n";

type CardPref = { hidden: boolean };

export function SupportCard({
  lang,
  onSupport,
}: {
  lang: Lang;
  onSupport: () => void;
}) {
  const [pref, setPref, ready] = usePersistent<CardPref>(SUPPORT_CARD_STORAGE_KEY, { hidden: false });
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  if (!ready || pref.hidden) return null;

  const path = resolveSupportPath();

  return (
    <aside
      className="rounded-xl border border-border/80 bg-surface/80 px-4 py-3"
      data-soft-money="card"
      data-support-kind={path.kind}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg">{L("ادعم واحة", "Support Waha")}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            {L("بقشيش صغير إن أحببت — اختياري تماماً.", "A small tip if you like — entirely optional.")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onSupport}
            className="h-8 rounded-md px-2.5 text-xs text-primary hover:bg-surface-2"
          >
            {L("ادعم", "Support")}
          </button>
          <button
            type="button"
            onClick={() => setPref({ hidden: true })}
            className="h-8 rounded-md px-2 text-xs text-subtle hover:bg-surface-2 hover:text-fg"
            aria-label={L("إخفاء البطاقة", "Hide the card")}
          >
            {L("إخفاء", "Hide")}
          </button>
        </div>
      </div>
    </aside>
  );
}
