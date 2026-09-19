import { Phone } from "lucide-react";
import { emergencyTitle, SA_EMERGENCY_STRIP } from "@/lib/emergency-sa";
import { t, type Lang } from "@/lib/i18n";

export function EmergencyStrip({ lang }: { lang: Lang }) {
  return (
    <section
      className="mt-6 rounded-xl border border-warn/40 bg-surface px-4 py-3"
      data-testid="emergency-strip"
    >
      <p className="mb-2 flex items-center gap-2 text-xs font-medium text-muted">
        <Phone className="size-3.5" strokeWidth={1.75} />
        {t(lang, "emergencySa")}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SA_EMERGENCY_STRIP.map((row) => (
          <a
            key={row.n}
            href={`tel:${row.n}`}
            data-testid={`emergency-${row.n}`}
            className="flex min-h-12 items-center justify-between rounded-lg border border-border bg-bg px-3 hover:bg-surface-2"
          >
            <span className="text-xs text-muted">{emergencyTitle(lang, row)}</span>
            <span className="num font-mono text-base tabular-nums text-primary">{row.n}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
