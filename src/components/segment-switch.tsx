import { SEGMENTS, segmentTitle } from "@/lib/segments";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store/app-store";

export function SegmentSwitch({ compact = false }: { compact?: boolean }) {
  const lang = useAppStore((s) => s.lang);
  const segment = useAppStore((s) => s.segment);
  const setSegment = useAppStore((s) => s.setSegment);

  return (
    <div className={cn("flex flex-wrap gap-1.5", compact && "max-w-full")}>
      <span className="sr-only">{t(lang, "segment")}</span>
      {SEGMENTS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => setSegment(id)}
          className={cn(
            "h-9 rounded-full border px-3 text-sm transition-colors",
            segment === id ? "border-primary bg-surface-2 text-fg" : "border-border bg-surface text-muted hover:text-fg",
          )}
        >
          {segmentTitle(lang, id)}
        </button>
      ))}
    </div>
  );
}
