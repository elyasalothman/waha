import type { Audience } from "@/lib/catalog";
import type { ChildSegment } from "@/lib/child-mode";
import { t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store/app-store";

type Slice = { id: "personal" | "child" | "work"; audience: Audience; segment: ChildSegment };

const SLICES: Slice[] = [
  { id: "personal", audience: "personal", segment: "all" },
  { id: "child", audience: "personal", segment: "child" },
  { id: "work", audience: "work", segment: "all" },
];

export function AudienceSwitch({ compact = false }: { compact?: boolean }) {
  const lang = useAppStore((s) => s.lang);
  const audience = useAppStore((s) => s.audience);
  const segment = useAppStore((s) => s.segment);
  const setAudience = useAppStore((s) => s.setAudience);
  const setSegment = useAppStore((s) => s.setSegment);
  const active = segment === "child" ? "child" : audience === "work" ? "work" : "personal";

  return (
    <div
      className={cn(
        "grid grid-cols-3 rounded-lg border border-border bg-surface p-1",
        compact ? "w-56" : "w-full",
      )}
      role="tablist"
      aria-label={lang === "ar" ? "شريحة" : "Slice"}
      data-testid="audience-switch"
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
            active === slice.id ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
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
