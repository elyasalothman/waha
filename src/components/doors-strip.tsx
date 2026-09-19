import { doorsEnabled, primaryLauncherDoors } from "@/lib/doors";
import { appIcon } from "@/lib/icons";
import { t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { openExternal } from "@/lib/links";
import { useAppStore } from "@/store/app-store";

export function DoorsStrip({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  const features = useAppStore((s) => s.features);
  const doors = doorsEnabled(primaryLauncherDoors(), features);
  if (!doors.length) return null;
  if (compact) {
    return (
      <nav aria-label={t(lang, "ourSites")} className="grid gap-1.5">
        {doors.map((door) => {
          const Icon = appIcon(door.icon);
          return (
            <button
              key={door.id}
              type="button"
              data-door={door.id}
              onClick={() => void openExternal(door.href)}
              className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 text-start text-sm text-fg hover:bg-surface-2"
            >
              <Icon className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
              <span className="truncate">{door.title[lang]}</span>
            </button>
          );
        })}
      </nav>
    );
  }
  return (
    <nav aria-label={t(lang, "ourSites")} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {doors.map((door) => {
        const Icon = appIcon(door.icon);
        return (
          <button
            key={door.id}
            type="button"
            data-door={door.id}
            onClick={() => void openExternal(door.href)}
            className={cn(
              "flex min-h-14 w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-start text-fg hover:bg-surface-2",
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-2 text-muted">
              <Icon className="size-4" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block font-medium leading-tight">{door.title[lang]}</span>
              <span className="mt-0.5 block text-sm leading-snug text-muted">{door.blurb[lang]}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
