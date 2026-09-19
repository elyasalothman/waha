import { createFileRoute } from "@tanstack/react-router";
import { AudienceSwitch } from "@/components/audience-switch";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const lang = useAppStore((s) => s.lang);

  return (
    <div className="mx-auto max-w-xl" data-settings="waha-for-you">
      <header className="mb-8">
        <h1 className="font-display text-4xl tracking-tight">{t(lang, "settings")}</h1>
        <p className="mt-2 max-w-xl text-muted">{t(lang, "wahaForYouBlurb")}</p>
      </header>
      <section aria-labelledby="waha-for-you-heading">
        <h2 id="waha-for-you-heading" className="mb-3 text-sm font-medium text-muted">
          {t(lang, "wahaForYou")}
        </h2>
        <AudienceSwitch />
      </section>
    </div>
  );
}
