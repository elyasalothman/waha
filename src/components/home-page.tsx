import { Link } from "@tanstack/react-router";
import { HouseDoors } from "@/components/house-doors";
import { HayatCard } from "@/components/hayat-card";
import { Compass } from "lucide-react";
import { CompanyWatchlist } from "@/components/company-watchlist";
import { DailyActions } from "@/components/daily-actions";
import { DailyBriefing } from "@/components/daily-briefing";
import { useAppStore } from "@/store/app-store";

export function HomePage() {
  const lang = useAppStore((s) => s.lang);
  return (
    <div
      className="mx-auto max-w-3xl"
      data-home-sections="hayat house-sites news watchlist shortcuts"
      data-guest-read="open"
    >
      <header className="mb-5 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl tracking-tight">
          {lang === "ar" ? "يومك في واحة" : "Your day in Waha"}
        </h1>
        <Link
          to="/more"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium text-primary hover:bg-surface-2"
        >
          <Compass className="size-4" aria-hidden="true" />
          {lang === "ar" ? "استكشف" : "Explore"}
        </Link>
      </header>
      <div className="space-y-4">
        <HayatCard />
        <HouseDoors />
        <DailyBriefing lang={lang} />
        <CompanyWatchlist lang={lang} />
        <DailyActions lang={lang} />
      </div>
    </div>
  );
}
