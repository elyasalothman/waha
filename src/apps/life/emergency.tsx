import { emergencyTitle, SA_EMERGENCY } from "@/lib/emergency-sa";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export function EmergencyApp() {
  const lang = useAppStore((s) => s.lang);
  return (
    <div className="space-y-2">
      <p className="mb-3 text-sm text-muted">{t(lang, "emergencySa")}</p>
      {SA_EMERGENCY.map((row) => (
        <a
          key={row.n}
          href={`tel:${row.n}`}
          className="flex h-14 items-center justify-between rounded-xl border border-border bg-surface px-4 hover:bg-surface-2"
        >
          <span>{emergencyTitle(lang, row)}</span>
          <span className="num font-mono text-lg tabular-nums text-primary">{row.n}</span>
        </a>
      ))}
    </div>
  );
}
