import type { Audience } from "@/lib/catalog";
import { t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store/app-store";

export function AudienceSwitch({ compact = false }: { compact?: boolean }) {
  const lang = useAppStore((s) => s.lang);
  const audience = useAppStore((s) => s.audience);
  const setAudience = useAppStore((s) => s.setAudience);

  return (
    <div
      className={cn(
        "grid grid-cols-2 rounded-lg border border-border bg-surface p-1",
        compact ? "w-48" : "w-full",
      )}
      role="tablist"
      aria-label={lang === "ar" ? "تصنيف" : "Audience"}
    >
      {(["personal", "work"] as Audience[]).map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={audience === id}
          onClick={() => setAudience(id)}
          className={cn(
            "h-9 rounded-md text-sm font-medium transition-colors duration-150",
            audience === id ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
          )}
        >
          {t(lang, id)}
        </button>
      ))}
    </div>
  );
}

export function audienceLabel(lang: Lang, audience: Audience) {
  return t(lang, audience);
}
