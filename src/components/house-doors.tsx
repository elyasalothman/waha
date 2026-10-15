import { ExternalLink } from "@/components/external-link";
import { directoryHouseSites } from "@/lib/house-sites";
import { appIcon } from "@/lib/icons";
import { useAppStore } from "@/store/app-store";

/** Shared house catalog; full-window native browser on iOS, new tab on web. */
export function HouseDoors() {
  const lang = useAppStore((s) => s.lang);
  return (
    <section aria-labelledby="house-sites-title" data-home-section="house-sites">
      <h2 id="house-sites-title" className="mb-3 font-display text-2xl">
        {lang === "ar" ? "مواقعنا" : "Our sites"}
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {directoryHouseSites().map((site) => {
          const Icon = appIcon(site.icon);
          return (
            <ExternalLink
              key={site.id}
              href={site.href}
              data-house-site={site.id}
              className="flex min-h-20 items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 hover:bg-surface-2"
            >
              <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block font-medium">{site.title[lang]}</span>
                <span className="mt-1 block text-sm text-muted">{site.blurb[lang]}</span>
                <span
                  dir="ltr"
                  className="mt-1 block break-all text-start font-mono text-xs text-subtle"
                >
                  {site.host}
                </span>
              </span>
            </ExternalLink>
          );
        })}
      </div>
    </section>
  );
}
