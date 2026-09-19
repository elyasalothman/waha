import { FAMILY_EMERGENCY_NUMBERS, emergencyTel } from "@/lib/emergency";
import { t, type Lang } from "@/lib/i18n";

export function EmergencyStrip({ lang }: { lang: Lang }) {
  return (
    <section aria-label={t(lang, "emergencyStrip")} className="rounded-xl border border-border bg-surface px-3 py-3">
      <p className="mb-2 text-xs text-muted">{t(lang, "emergencyStrip")}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FAMILY_EMERGENCY_NUMBERS.map((row) => (
          <a
            key={row.n}
            href={emergencyTel(row.n)}
            className="flex min-h-12 flex-col justify-center rounded-lg border border-border bg-bg px-3 py-2 hover:bg-surface-2"
          >
            <span className="font-mono text-lg tabular-nums text-primary">{row.n}</span>
            <span className="text-xs text-muted">{lang === "ar" ? row.ar : row.en}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
