import type { Audience } from "@/lib/catalog";
import type { ChildSegment } from "@/lib/child-mode";
import { t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store/app-store";

type SliceId = "personal" | "child" | "family" | "work";
type Slice = { id: SliceId; audience: Audience; segment: ChildSegment };

const SLICES: Slice[] = [
  { id: "personal", audience: "personal", segment: "all" },
  { id: "child", audience: "personal", segment: "child" },
  { id: "family", audience: "personal", segment: "family" },
  { id: "work", audience: "work", segment: "all" },
];

function activeSlice(audience: Audience, segment: ChildSegment): SliceId {
  if (segment === "child") return "child";
  if (segment === "family") return "family";
  if (audience === "work") return "work";
  return "personal";
}

export function AudienceSwitch({ compact = false }: { compact?: boolean }) {
  const lang = useAppStore((s) => s.lang);
  const audience = useAppStore((s) => s.audience);
  const segment = useAppStore((s) => s.segment);
  const setAudience = useAppStore((s) => s.setAudience);
  const setSegment = useAppStore((s) => s.setSegment);
  const active = activeSlice(audience, segment);

  return (
    <div
      className={cn(
        "grid grid-cols-2 rounded-lg border border-border bg-surface p-1 sm:grid-cols-4",
        compact ? "max-w-xl" : "w-full",
      )}
      role="tablist"
      aria-label={t(lang, "wahaForYou")}
      data-testid="audience-switch"
      data-waha-for-you="slices"
    >
      {SLICES.map((slice) => (
        <button
          key={slice.id}
          type="button"
          role="tab"
          aria-selected={active === slice.id}
          data-testid={`slice-${slice.id}`}
          onClick={() => {
            setAudience(slice.audience);
            setSegment(slice.segment);
          }}
          className={cn(
            "h-9 rounded-md text-sm font-medium transition-colors duration-150",
            active === slice.id ? "bg-primary-wash text-primary" : "text-muted hover:text-fg",
          )}
        >
          {t(lang, slice.id)}
        </button>
      ))}
    </div>
  );
}

export function audienceLabel(lang: Lang, audience: Audience) {
  return t(lang, audience);
}
