import { createFileRoute } from "@tanstack/react-router";
import { t } from "@/lib/i18n";
import { loc } from "@/lib/locale";
import { LABS, LAB_META } from "@/lib/themes";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/labs")({ component: LabsPage });

function LabsPage() {
  const lang = useAppStore((s) => s.lang);
  const labs = useAppStore((s) => s.labs);
  const toggleLab = useAppStore((s) => s.toggleLab);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl tracking-tight">{t(lang, "labs")}</h1>
      <p className="mt-2 text-sm text-muted">{t(lang, "experimental")}</p>
      <div className="mt-8 grid gap-3">
        {LABS.map((id) => {
          const on = labs.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleLab(id)}
              className={cn(
                "rounded-xl border px-4 py-4 text-start",
                on ? "border-primary bg-surface-2" : "border-border bg-surface",
              )}
            >
              <p className="font-medium">
                {loc(lang, LAB_META[id].title)}{" "}
                <span className="text-xs text-subtle">{t(lang, "experimental")}</span>
              </p>
              <p className="mt-1 text-sm text-muted">{loc(lang, LAB_META[id].blurb)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
