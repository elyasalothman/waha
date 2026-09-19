import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { AppCard } from "@/components/app-card";
import { Button } from "@/components/ui/button";
import { appIcon } from "@/lib/icons";
import { t } from "@/lib/i18n";
import { byCategory } from "@/lib/catalog";
import { lumaDoor, otherYardGames, workshopGames } from "@/lib/games-yard";
import { playSfx, setSfxMuted, sfxMuted } from "@/lib/sfx";
import { readScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

const BEST_LABEL: Record<string, { ar: string; en: string; suffix?: string }> = {
  kalima: { ar: "أفضل فوز", en: "Best win" },
  abaar: { ar: "أسرع بئر", en: "Fastest well", suffix: "s" },
  majra: { ar: "أقل لفات", en: "Fewest turns" },
  kutal: { ar: "أفضل لوح", en: "Best board" },
  memory: { ar: "أقل حركات", en: "Fewest moves" },
  snake: { ar: "أفضل زحف", en: "Best run" },
  merge2048: { ar: "أعلى دمج", en: "Highest merge" },
  tetris: { ar: "أفضل أسطر", en: "Best lines" },
  reaction: { ar: "أفضل رد", en: "Best reaction" },
  breakout: { ar: "أفضل جدار", en: "Best wall" },
};

function BestChip({ id, lang }: { id: string; lang: "ar" | "en" }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const raw = id === "memory" ? Number(localStorage.getItem("waha:memory-best") ?? 0) || readScore("memory") : readScore(id);
    setValue(raw);
  }, [id]);
  if (!value) return null;
  const meta = BEST_LABEL[id];
  return (
    <span className="text-[11px] tabular-nums text-subtle">
      {meta ? (lang === "ar" ? meta.ar : meta.en) : t(lang, "best")} · {value}
      {meta?.suffix ?? ""}
    </span>
  );
}

export function GamesYard() {
  const lang = useAppStore((s) => s.lang);
  const items = byCategory("games", "personal");
  const workshop = workshopGames(items);
  const rest = otherYardGames(items);
  const luma = lumaDoor();
  const LumaIcon = appIcon(luma.icon);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(sfxMuted());
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted">{lang === "ar" ? "قسم الألعاب فقط" : "Games, in their own yard"}</p>
          <h1 className="mt-1 font-display text-4xl tracking-tight">{t(lang, "games")}</h1>
          <p className="mt-2 max-w-xl text-muted">{t(lang, "gamesBlurb")}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            const next = !muted;
            setSfxMuted(next);
            setMuted(next);
            if (!next) playSfx("tap");
          }}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          {muted ? t(lang, "sfxOff") : t(lang, "sfxOn")}
        </Button>
      </header>

      <a
        href={luma.href}
        data-door="luma"
        className="mb-10 flex min-h-24 items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4 text-fg transition-colors hover:bg-surface-2"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-surface-2 text-primary">
          <LumaIcon className="size-5" strokeWidth={1.75} />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-2xl leading-tight">{luma.title[lang]}</span>
          <span className="mt-1 block text-sm text-muted">{luma.blurb[lang]}</span>
          <span className="mt-2 block font-mono text-xs text-subtle">{luma.href.replace("https://", "")}</span>
        </span>
      </a>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "workshop")}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {workshop.map((item) => (
            <div key={item.id} className="relative">
              <AppCard item={item} lang={lang} />
              <div className="pointer-events-none absolute end-4 top-4">
                <BestChip id={item.id} lang={lang} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-medium text-muted">{t(lang, "moreGames")}</h2>
          <Link to="/" className="text-sm text-muted hover:text-fg">
            {t(lang, "back")}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rest.map((item) => (
            <div key={item.id} className="relative">
              <AppCard item={item} lang={lang} />
              <div className="pointer-events-none absolute end-4 top-4">
                <BestChip id={item.id} lang={lang} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
