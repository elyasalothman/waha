import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { HOUSE_INTEGRATIONS } from "@/lib/house-integrations";
import { ExternalLink } from "@/components/external-link";
import { directoryHouseSites, HOUSE_GROUPS } from "@/lib/house-sites";
import { appIcon } from "@/lib/icons";
import { useAppStore } from "@/store/app-store";

function FeatureLink({ id, href, children }: { id: string; href: string; children: ReactNode }) {
  const className =
    "flex min-h-20 items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 hover:bg-surface-2";
  return HOUSE_INTEGRATIONS[id] ? (
    <Link to={HOUSE_INTEGRATIONS[id]} data-house-site={id} className={className}>
      {children}
    </Link>
  ) : (
    <ExternalLink href={href} data-house-site={id} className={className}>
      {children}
    </ExternalLink>
  );
}
/** Internal features first, source sites remain secondary destinations. */
export function HouseDoors() {
  const lang = useAppStore((s) => s.lang);
  return (
    <section aria-labelledby="house-sites-title" data-home-section="house-sites">
      <h2 id="house-sites-title" className="mb-3 font-display text-2xl">
        {lang === "ar" ? "مواقعنا" : "Our sites"}
      </h2>
      {HOUSE_GROUPS.map((group) => (
        <div key={group.en} className="mb-5">
          <h3 className="mb-2 text-lg font-semibold">{group[lang]}</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {directoryHouseSites()
              .filter((site) => (group.ids as readonly string[]).includes(site.id))
              .map((site) => {
                const Icon = appIcon(site.icon);
                return (
                  <div key={site.id} className="min-w-0">
                    <FeatureLink id={site.id} href={site.href}>
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
                    </FeatureLink>
                    {HOUSE_INTEGRATIONS[site.id] && (
                      <ExternalLink
                        href={site.href}
                        className="inline-flex min-h-11 items-center px-3 text-xs text-muted"
                      >
                        {lang === "ar" ? "افتح الموقع الكامل ↗" : "Open full site ↗"}
                      </ExternalLink>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </section>
  );
}
