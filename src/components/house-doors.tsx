import { HOUSE_DOORS, doorBlurb, doorTitle } from "@/lib/house";
import { t, type Lang } from "@/lib/i18n";

export function HouseDoors({ lang }: { lang: Lang }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "doors")}</h2>
      <p className="mb-3 max-w-2xl text-sm text-muted">{t(lang, "doorsBlurb")}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {HOUSE_DOORS.map((door) => (
          <a
            key={door.id}
            href={door.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-border bg-surface p-4 hover:bg-surface-2"
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
