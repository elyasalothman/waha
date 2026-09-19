import { primaryLauncherDoors } from "@/lib/doors";
import { appIcon } from "@/lib/icons";
import { t, type Lang } from "@/lib/i18n";

export function DoorsStrip({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  const doors = primaryLauncherDoors();
  if (compact) {
    return (
      <nav aria-label={t(lang, "ourSites")} className="grid gap-1.5">
        {doors.map((door) => {
          const Icon = appIcon(door.icon);
          return (
            <a
              key={door.id}
              href={door.href}
              data-door={door.id}
              className="flex min-h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-fg hover:opacity-95"
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{door.title[lang]}</span>
            </a>
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
          <a
            key={door.id}
            href={door.href}
            data-door={door.id}
            className="flex min-h-16 items-center gap-3 rounded-xl bg-primary px-4 py-3 text-primary-fg shadow-(--shadow-soft) hover:opacity-95"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-fg/12">
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block font-medium leading-tight">{door.title[lang]}</span>
              <span className="mt-0.5 block text-sm leading-snug text-primary-fg/80">{door.blurb[lang]}</span>
            </span>
          </a>
        );
      })}
    </nav>
  );
}
