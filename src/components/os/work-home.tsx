import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { t } from "@/lib/i18n";
import { workPulse } from "@/lib/pulse";
import { isFeatureOn } from "@/lib/features";
import { useAppStore } from "@/store/app-store";

export function WorkHome() {
  const lang = useAppStore((s) => s.lang);
  const features = useAppStore((s) => s.features);
  const [pulse, setPulse] = useState(workPulse());

  useEffect(() => {
    setPulse(workPulse());
  }, []);

  const hero = pulse.stats[0];

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-xs tracking-wide text-muted">{t(lang, "work")}</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">{t(lang, "workBanner")}</h1>
      <p className="mt-3 text-sm text-muted">{t(lang, "workBannerBody")}</p>

      {hero ? (
        <Link
          to="/app/$id"
          params={{ id: hero.href }}
          className="mt-8 block rounded-3xl border border-border bg-surface px-6 py-7 hover:bg-surface-2"
        >
          <p className="text-xs text-muted">{lang === "ar" ? hero.ar : hero.en}</p>
          <p className="mt-3 font-display text-5xl tabular-nums">{hero.value}</p>
        </Link>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {pulse.stats.slice(1, 3).map((s) => (
          <Link
            key={s.id}
            to="/app/$id"
            params={{ id: s.href }}
            className="rounded-2xl border border-border bg-surface px-4 py-4 hover:bg-surface-2"
          >
            <p className="text-xs text-muted">{lang === "ar" ? s.ar : s.en}</p>
            <p className="mt-2 font-mono text-2xl tabular-nums">{s.value}</p>
          </Link>
        ))}
      </div>

      {isFeatureOn(features, "work") ? (
        <Link to="/workspace" className="mt-10 inline-block text-sm text-muted hover:text-fg">
          {t(lang, "workCatalog")}
        </Link>
      ) : null}
    </div>
  );
}
