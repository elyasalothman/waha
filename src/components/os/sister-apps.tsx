import { isFeatureOn, type FeatureId } from "@/lib/features";
import { openExternal, SISTER_APPS } from "@/lib/links";
import { t, type Lang } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

const DOOR_FEATURE: Record<string, FeatureId> = {
  tahajjud: "tahajjud",
  midad: "midad",
  sites: "sites",
};

export function SisterApps({ lang }: { lang: Lang }) {
  const features = useAppStore((s) => s.features);
  const doors = SISTER_APPS.filter((app) => {
    if (!isFeatureOn(features, "sisters")) return false;
    const door = DOOR_FEATURE[app.id];
    return !door || isFeatureOn(features, door);
  });
  if (!doors.length) return null;
  return (
    <section>
      <h2 className="text-sm font-medium text-muted">{t(lang, "sisters")}</h2>
      <p className="mt-1 text-sm text-subtle">{t(lang, "sistersBlurb")}</p>
      <ul className="mt-4 space-y-2">
        {doors.map((app) => (
          <li key={app.id}>
            <button
              type="button"
              onClick={() => void openExternal(app.href)}
              className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-start hover:bg-surface-2"
            >
              <span>
                <span className="block font-medium">{app.title[lang]}</span>
                <span className="block text-xs text-muted">{app.blurb[lang]}</span>
              </span>
              <span className="text-xs text-subtle" dir="ltr">
                {new URL(app.href).host}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
