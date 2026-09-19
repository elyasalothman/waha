import { createFileRoute } from "@tanstack/react-router";
import { HouseDoors } from "@/components/house-doors";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/house")({ component: HousePage });

function HousePage() {
  const lang = useAppStore((s) => s.lang);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl tracking-tight">{t(lang, "house")}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t(lang, "doorsBlurb")}</p>
      <div className="mt-8">
        <HouseDoors lang={lang} />
      </div>
    </div>
  );
}
