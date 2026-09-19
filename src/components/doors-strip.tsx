import { Link } from "@tanstack/react-router";
import { ExternalLink } from "@/components/external-link";
import { doorOpenHref, doorOpensInternalShelf, primaryLauncherDoors, type Door } from "@/lib/doors";
import { appIcon } from "@/lib/icons";
import { t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

function DoorShell({
  door,
  className,
  children,
}: {
  door: Door;
  className: string;
  children: ReactNode;
}) {
  if (doorOpensInternalShelf(door)) {
    return (
      <Link to="/books" data-door={door.id} data-opens={doorOpenHref(door)} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <ExternalLink href={door.href} data-door={door.id} className={className}>
      {children}
    </ExternalLink>
  );
}

export function DoorsStrip({
  lang,
  compact = false,
  row = false,
}: {
  lang: Lang;
  compact?: boolean;
  row?: boolean;
}) {
  const doors = primaryLauncherDoors();
  if (row) {
    return (
      <nav aria-label={t(lang, "ourSites")} className="flex flex-wrap gap-2" data-home-section="house-doors">
        {doors.map((door) => {
          const Icon = appIcon(door.icon);
          const shelf = doorOpensInternalShelf(door);
          return (
            <DoorShell
              key={door.id}
              door={door}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-lg border bg-surface px-3 text-sm text-fg hover:bg-surface-2",
                shelf ? "border-primary/40" : "border-border",
              )}
            >
              <Icon className={cn("size-4 shrink-0", shelf ? "text-primary" : "text-muted")} strokeWidth={1.75} />
              <span>{door.title[lang]}</span>
            </DoorShell>
          );
        })}
      </nav>
    );
  }
  if (compact) {
    return (
      <nav aria-label={t(lang, "ourSites")} className="grid gap-1.5">
        {doors.map((door) => {
          const Icon = appIcon(door.icon);
          const shelf = doorOpensInternalShelf(door);
          return (
            <DoorShell
              key={door.id}
              door={door}
              className={cn(
                "flex min-h-10 items-center gap-2 rounded-lg border bg-surface px-3 text-sm text-fg hover:bg-surface-2",
                shelf ? "border-primary/40" : "border-border",
              )}
            >
              <Icon className={cn("size-4 shrink-0", shelf ? "text-primary" : "text-muted")} strokeWidth={1.75} />
              <span className="truncate">{door.title[lang]}</span>
            </DoorShell>
          );
        })}
      </nav>
    );
  }
  return (
    <nav aria-label={t(lang, "ourSites")} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {doors.map((door) => {
        const Icon = appIcon(door.icon);
        const shelf = doorOpensInternalShelf(door);
        return (
          <DoorShell
            key={door.id}
            door={door}
            className={cn(
              "flex min-h-14 items-center gap-3 rounded-xl border bg-surface px-4 py-3 text-fg hover:bg-surface-2",
              shelf ? "border-primary/40" : "border-border",
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-md",
                shelf ? "bg-primary/10 text-primary" : "bg-surface-2 text-muted",
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block font-medium leading-tight">{door.title[lang]}</span>
              <span className="mt-0.5 block text-sm leading-snug text-muted">{door.blurb[lang]}</span>
            </span>
          </DoorShell>
        );
      })}
    </nav>
  );
}
