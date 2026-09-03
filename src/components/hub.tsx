import type { Category } from "@/lib/catalog";
import { byCategory, lanesPresent, LANE_LABEL } from "@/lib/catalog";
import { AppGrid } from "@/components/app-card";
import { t, type I18nKey } from "@/lib/i18n";
import { CitySelect } from "@/components/city-select";
import { useAppStore } from "@/store/app-store";

const COPY: Record<Category, { title: I18nKey; blurb: I18nKey }> = {
  life: { title: "life", blurb: "lifeBlurb" },
  money: { title: "money", blurb: "moneyBlurb" },
  tools: { title: "tools", blurb: "toolsBlurb" },
  games: { title: "games", blurb: "gamesBlurb" },
  workspace: { title: "workspace", blurb: "workspaceBlurb" },
  studio: { title: "studio", blurb: "studioBlurb" },
};

export function Hub({ category, city }: { category: Category; city?: boolean }) {
  const lang = useAppStore((s) => s.lang);
  const audience = useAppStore((s) => s.audience);
  const copy = COPY[category];
  const items = byCategory(category, audience);
  const lanes = lanesPresent(items);
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <h1 className="font-display text-4xl tracking-tight">
          {audience === "work" && category === "money" ? t(lang, "finance") : t(lang, copy.title)}
        </h1>
        <p className="mt-2 max-w-xl text-muted">
          {audience === "work" && category === "money"
            ? lang === "ar"
              ? "ضريبة ورواتب وصندوق وهامش ربح"
              : "VAT, payroll, cashbook, and margin"
            : t(lang, copy.blurb)}
        </p>
        {city ? (
          <div className="mt-4 max-w-lg">
            <CitySelect compact />
          </div>
        ) : null}
      </header>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{t(lang, "empty")}</p>
      ) : lanes.length > 1 ? (
        <div className="space-y-10">
          {lanes.map((lane) => {
            const group = items.filter((i) => i.lane === lane);
            if (!group.length) return null;
            return (
              <section key={lane}>
                <h2 className="mb-3 text-sm font-medium text-muted">{LANE_LABEL[lane][lang]}</h2>
                <AppGrid items={group} lang={lang} />
              </section>
            );
          })}
        </div>
      ) : (
        <AppGrid items={items} lang={lang} />
      )}
    </div>
  );
}
