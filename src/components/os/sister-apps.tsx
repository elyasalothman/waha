import { openExternal, SISTER_APPS } from "@/lib/links";
import { t, type Lang } from "@/lib/i18n";

export function SisterApps({ lang }: { lang: Lang }) {
  return (
    <section>
      <h2 className="text-sm font-medium text-muted">{t(lang, "sisters")}</h2>
      <p className="mt-1 text-sm text-subtle">{t(lang, "sistersBlurb")}</p>
      <ul className="mt-4 space-y-2">
        {SISTER_APPS.map((app) => (
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
