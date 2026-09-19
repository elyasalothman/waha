import { FEATURES, type FeatureLane } from "@/lib/features";
import { t, type Lang } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

function Lane({ lane, lang }: { lane: FeatureLane; lang: Lang }) {
  const features = useAppStore((s) => s.features);
  const setFeature = useAppStore((s) => s.setFeature);
  const items = FEATURES.filter((f) => f.lane === lane);
  if (!items.length) return null;
  const title = lane === "labs" ? t(lang, "labs") : lane === "core" ? t(lang, "coreApps") : t(lang, "settings");
  return (
    <section className={cn(lane === "labs" && "rounded-3xl border border-primary/25 bg-surface p-5")}>
      <h2 className="text-sm font-medium text-muted">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => {
          const on = features[item.id] !== false;
          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-bg/40 px-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {item.title[lang]}
                  {item.elevated ? <span className="ms-2 text-[11px] text-primary">{t(lang, "labs")}</span> : null}
                </p>
                <p className="text-xs text-muted">{item.blurb[lang]}</p>
              </div>
              <button
                type="button"
                disabled={item.locked}
                aria-pressed={on}
                onClick={() => setFeature(item.id, !on)}
                className={cn(
                  "h-8 min-w-16 rounded-full px-3 text-xs",
                  on ? "bg-primary text-primary-fg" : "border border-border text-muted",
                  item.locked && "opacity-50",
                )}
              >
                {on ? t(lang, "enabled") : t(lang, "disabled")}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function FeatureStore({ lang }: { lang: Lang }) {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-display text-3xl tracking-tight">{t(lang, "featureStore")}</h2>
        <p className="mt-2 text-sm text-muted">{t(lang, "featureStoreBlurb")}</p>
      </header>
      <Lane lane="labs" lang={lang} />
      <Lane lane="core" lang={lang} />
      <Lane lane="system" lang={lang} />
    </div>
  );
}
