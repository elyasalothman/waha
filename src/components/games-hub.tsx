import { ExternalLink } from "lucide-react";
import { AppCard } from "@/components/app-card";
import { SfxToggle } from "@/components/game-hud";
import { CLASSIC_IDS, GAME_DOORS, SIGNATURE_IDS } from "@/lib/games/doors";
import { getApp } from "@/lib/catalog";
import { appIcon } from "@/lib/icons";
import { t } from "@/lib/i18n";
import { readScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

function useScores() {
  const [scores, setScores] = useState<Record<string, number>>({});
  useEffect(() => {
    const next: Record<string, number> = {};
    for (const id of [...SIGNATURE_IDS, ...CLASSIC_IDS]) next[id] = readScore(id);
    try {
      const memory = JSON.parse(localStorage.getItem("waha:memory-bests") ?? "{}") as Record<string, number>;
      next.memory = Number(memory["8"] ?? 0);
      const persist = (key: string) => {
        const raw = localStorage.getItem(key);
        if (!raw) return 0;
        try {
          return Number(JSON.parse(raw)) || 0;
        } catch {
          return Number(raw) || 0;
        }
      };
      next.kalima = persist("waha:kalima-best") || next.kalima;
      next.abiar = persist("waha:abiar-best") || next.abiar;
      next.majra = persist("waha:majra-best") || next.majra;
    } catch {
      /* ignore */
    }
    setScores(next);
  }, []);
  return scores;
}

export function GamesHub() {
  const lang = useAppStore((s) => s.lang);
  const signature = SIGNATURE_IDS.map(getApp).filter((x): x is NonNullable<typeof x> => !!x);
  const classics = CLASSIC_IDS.map(getApp).filter((x): x is NonNullable<typeof x> => !!x);
  const scores = useScores();

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight">{t(lang, "games")}</h1>
          <p className="mt-2 max-w-xl text-muted">{t(lang, "gamesBlurb")}</p>
        </div>
        <SfxToggle />
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium text-muted">{lang === "ar" ? "أبواب الخارج" : "Doors out"}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {GAME_DOORS.map((door) => (
            <a
              key={door.id}
              href={door.href}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:bg-surface-2"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-display text-2xl">{door.title[lang]}</span>
                <ExternalLink className="size-4 text-subtle transition-colors group-hover:text-fg" />
              </span>
              <span className="mt-2 text-sm leading-relaxed text-muted">{door.blurb[lang]}</span>
              <span className="mt-3 font-mono text-xs text-subtle" dir="ltr">
                {door.href.replace("https://", "")}
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium text-muted">{lang === "ar" ? "توقيع واحة" : "Waha’s own"}</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {signature.map((item) => {
            const Icon = appIcon(item.icon);
            const score = scores[item.id];
            return (
              <Link
                key={item.id}
                to="/app/$id"
                params={{ id: item.id }}
                className="flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:bg-surface-2"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex size-11 items-center justify-center rounded-md bg-surface-2 text-primary">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  {score ? (
                    <span className="font-mono text-xs tabular-nums text-muted">
                      {t(lang, "best")} {score}
                    </span>
                  ) : null}
                </span>
                <span className="mt-4 font-display text-2xl">{item.title[lang]}</span>
                <span className="mt-1 text-sm leading-relaxed text-muted">{item.blurb[lang]}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted">{lang === "ar" ? "استراحة" : "A short rest"}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {classics.map((item) => (
            <AppCard key={item.id} item={item} lang={lang} />
          ))}
        </div>
      </section>
    </div>
  );
}
