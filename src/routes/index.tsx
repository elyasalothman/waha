import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CitySelect } from "@/components/city-select";
import { DailySlides } from "@/components/daily-slides";
import { ShadowDay } from "@/components/shadow-day";
import { dailyBundle } from "@/lib/daily";
import { t } from "@/lib/i18n";
import { useNow } from "@/hooks/use-now";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/")({ component: Home });

/** Quiet day-shadow. The Maydan timeline lives on `/maydan`. */
function Home() {
  const lang = useAppStore((s) => s.lang);
  const now = useNow(60_000);
  const daily = useMemo(() => dailyBundle(now), [now.toDateString()]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 font-display text-3xl tracking-tight">{t(lang, "shadowDay")}</h1>
      <ShadowDay />
      <div className="mt-6 max-w-lg">
        <CitySelect compact />
      </div>
      <div className="mt-10">
        <DailySlides lang={lang} ayah={daily.ayah} asma={daily.asma} proverb={daily.proverb} />
      </div>
    </div>
  );
}
