import { FIRST_SCREEN_SEGMENTS, SEGMENTS, segmentTitle, type Segment } from "@/lib/segments";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store/app-store";

export function SegmentSwitch({
  compact = false,
  firstScreen = false,
}: {
  compact?: boolean;
  firstScreen?: boolean;
}) {
  const lang = useAppStore((s) => s.lang);
  const segment = useAppStore((s) => s.segment);
  const setSegment = useAppStore((s) => s.setSegment);
  const ids = firstScreen
    ? segment === "child"
      ? (["all", ...FIRST_SCREEN_SEGMENTS.filter((id) => id !== "all"), "child"] as Segment[])
      : FIRST_SCREEN_SEGMENTS
    : SEGMENTS;

  if (firstScreen || compact) {
    return (
      <label className="block text-sm">
        <span className="sr-only">{t(lang, "segment")}</span>
        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value as Segment)}
          className="h-9 max-w-full rounded-md border border-border bg-surface px-2 text-sm text-fg"
          data-testid="segment-select"
        >
          {ids.map((id) => (
            <option key={id} value={id}>
              {segmentTitle(lang, id)}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="sr-only">{t(lang, "segment")}</span>
      {ids.map((id) => (
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
