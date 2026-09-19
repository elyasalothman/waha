import { HOUSE_DOORS, doorBlurb, doorTitle } from "@/lib/house";
import { t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export function HouseDoors({
  lang,
  compact,
  columns = 4,
}: {
  lang: Lang;
  compact?: boolean;
  columns?: 2 | 4;
}) {
  if (compact) {
    return (
      <nav aria-label={t(lang, "doors")} data-testid="house-doors">
        <div className={cn("grid gap-2", columns === 2 ? "grid-cols-2" : "grid-cols-4")}>
          {HOUSE_DOORS.map((door) => (
            <a
              key={door.id}
              href={door.href}
              target="_blank"
              rel="noreferrer"
              data-testid={`house-door-${door.id}`}
              className="flex min-h-12 items-center justify-center rounded-xl border border-border bg-surface px-2 text-center text-sm font-medium hover:bg-surface-2"
            >
              {doorTitle(lang, door)}
            </a>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <section data-testid="house-doors">
      <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "doors")}</h2>
      <p className="mb-3 max-w-2xl text-sm text-muted">{t(lang, "doorsBlurb")}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {HOUSE_DOORS.map((door) => (
          <a
            key={door.id}
            href={door.href}
            target="_blank"
            rel="noreferrer"
            data-testid={`house-door-${door.id}`}
            className={cn("rounded-xl border border-border bg-surface p-4 hover:bg-surface-2")}
          >
            <p className="font-medium">{doorTitle(lang, door)}</p>
            <p className="mt-1 text-sm text-muted">{doorBlurb(lang, door)}</p>
            <p className="mt-2 font-mono text-[11px] text-subtle" dir="ltr">
              {door.href.replace("https://", "")}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
