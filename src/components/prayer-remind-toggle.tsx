import { Bell, BellOff } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { usePrayerRemind, type RemindVia } from "@/lib/prayer-remind";
import { cn } from "@/lib/cn";

function viaLabel(lang: Lang, via: RemindVia, enabled: boolean) {
  if (!enabled) return t(lang, "remindOff");
  if (via === "capacitor" || via === "web") return t(lang, "remindOn");
  return t(lang, "remindQueued");
}

export function PrayerRemindToggle({
  lang,
  lat,
  lon,
  tz,
  compact,
}: {
  lang: Lang;
  lat: number;
  lon: number;
  tz: string;
  compact?: boolean;
}) {
  const { enabled, setEnabled, via } = usePrayerRemind({ lat, lon, tz, lang });
  const Icon = enabled ? Bell : BellOff;

  if (compact) {
    return (
      <button
        type="button"
        data-testid="prayer-remind"
        aria-pressed={enabled}
        onClick={() => void setEnabled(!enabled)}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full border px-3 text-sm",
          enabled ? "border-primary/50 bg-surface-2" : "border-border bg-surface hover:bg-surface-2",
        )}
      >
        <Icon className="size-3.5" strokeWidth={1.75} />
        {t(lang, "remind")}
      </button>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5" data-testid="prayer-remind">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">{t(lang, "remind")}</p>
          <p className="mt-1 text-sm text-muted">{t(lang, "remindHint")}</p>
          <p className="mt-1 text-xs text-subtle">{viaLabel(lang, via, enabled)}</p>
        </div>
        <button
          type="button"
          aria-pressed={enabled}
          onClick={() => void setEnabled(!enabled)}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm",
            enabled ? "border-primary/50 bg-surface-2" : "border-border bg-surface-2",
          )}
        >
          <Icon className="size-4" strokeWidth={1.75} />
          {enabled ? t(lang, "remindOn") : t(lang, "remindOff")}
        </button>
      </div>
    </section>
  );
}
