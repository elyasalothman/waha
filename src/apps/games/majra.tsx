import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { MAJRA_N, generateMajra, majraFlow, rotateMajra, sides, type MajraGrid, type PipeCell } from "@/lib/games/majra";
import { playSfx } from "@/lib/sfx";
import { readScore, writeBestMin } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

function PipeGlyph({ cell, wet }: { cell: PipeCell; wet: boolean }) {
  const open = sides(cell);
  const ink = wet ? "bg-primary" : "bg-muted";
  return (
    <span className="relative block size-[70%]" aria-hidden>
      <span className={cn("absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full", ink)} />
      {open[0] ? <span className={cn("absolute left-1/2 top-0 h-1/2 w-1.5 -translate-x-1/2 rounded-full", ink)} /> : null}
      {open[1] ? <span className={cn("absolute right-0 top-1/2 h-1.5 w-1/2 -translate-y-1/2 rounded-full", ink)} /> : null}
      {open[2] ? <span className={cn("absolute bottom-0 left-1/2 h-1/2 w-1.5 -translate-x-1/2 rounded-full", ink)} /> : null}
      {open[3] ? <span className={cn("absolute left-0 top-1/2 h-1.5 w-1/2 -translate-y-1/2 rounded-full", ink)} /> : null}
    </span>
  );
}

export function MajraApp() {
  const lang = useAppStore((s) => s.lang);
  const [grid, setGrid] = useState<MajraGrid>(() => generateMajra());
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState(0);
  const flow = useMemo(() => majraFlow(grid), [grid]);

  useEffect(() => {
    setBest(readScore("majra"));
  }, []);

  useEffect(() => {
    if (flow.won && moves > 0) {
      playSfx("win");
      setBest(writeBestMin("majra", moves));
    }
  }, [flow.won, moves]);

  function twist(r: number, c: number) {
    if (flow.won) return;
    playSfx("tap");
    setGrid((g) => rotateMajra(g, r, c));
    setMoves((n) => n + 1);
  }

  function reset() {
    setGrid(generateMajra());
    setMoves(0);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Stat label={lang === "ar" ? "اللفات" : "Turns"} value={moves} />
        <Stat label={t(lang, "best")} value={best || "—"} />
      </div>
      <p className="text-sm text-muted">
        {lang === "ar"
          ? "أدِر المجاري حتى يصل الماء من العين إلى الواحة في الأسفل."
          : "Turn the channels until water runs from the spring to the oasis below."}
      </p>
      <div className="mx-auto w-full max-w-sm">
        <p className="mb-2 text-center text-xs text-muted">{lang === "ar" ? "عين" : "Spring"}</p>
        <div className="grid gap-1.5 touch-manipulation" style={{ gridTemplateColumns: `repeat(${MAJRA_N}, minmax(0, 1fr))` }}>
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const wet = flow.filled[r]![c];
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  aria-label={lang === "ar" ? "أدِر المجرى" : "Turn the channel"}
                  onClick={() => twist(r, c)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-md border transition-[background-color,transform,border-color] duration-150 active:scale-[0.96]",
                    wet ? "border-primary/50 bg-primary/15" : "border-border bg-surface-2",
                    flow.won && wet && "border-success/50 bg-success/15",
                  )}
                >
                  <PipeGlyph cell={cell} wet={Boolean(wet)} />
                </button>
              );
            }),
          )}
        </div>
        <p className="mt-2 text-center text-xs text-muted">{lang === "ar" ? "واحة" : "Oasis"}</p>
      </div>
      {flow.won ? <p className="text-center text-success">{t(lang, "youWin")}</p> : null}
      <Button variant="outline" onClick={reset}>
        {t(lang, "newGame")}
      </Button>
    </div>
  );
}
