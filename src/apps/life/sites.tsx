import { ALHAJDA_SITES_INDEX, directoryDoors, doorHref } from "@/lib/doors";
import { appIcon } from "@/lib/icons";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export function SitesApp() {
  const lang = useAppStore((s) => s.lang);
  const doors = directoryDoors();

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t(lang, "doorHint")}</p>
      <ul className="space-y-2">
        {doors.map((door) => {
          const Icon = appIcon(door.icon);
          return (
            <li key={door.id}>
              <a
                href={doorHref(door)}
                className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 hover:bg-surface-2"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-2 text-primary">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{door.title[lang]}</span>
                  <span className="block text-sm text-muted">{door.blurb[lang]}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      <a
        href={ALHAJDA_SITES_INDEX}
        className="flex min-h-12 items-center justify-between rounded-xl border border-border px-4 text-sm text-primary hover:bg-surface-2"
      >
        <span>{t(lang, "allSites")}</span>
        <span className="font-mono text-xs text-subtle">alhajda.com/sites</span>
      </a>
    </div>
  );
}
