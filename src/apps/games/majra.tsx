import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { MAJRA_N, generateMajra, majraFlow, rotateMajra, type MajraGrid, type PipeCell } from "@/lib/games/majra";
import { playSfx } from "@/lib/sfx";
import { readScore, writeBestMin } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

function glyph(cell: PipeCell): string {
  if (cell.kind === "X") return "┼";
  if (cell.kind === "I") return cell.rot % 2 === 0 ? "│" : "─";
  if (cell.kind === "T") return ["┬", "┤", "┴", "├"][cell.rot]!;
  return ["└", "┌", "┐", "┘"][cell.rot]!;
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
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${MAJRA_N}, minmax(0, 1fr))` }}>
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const wet = flow.filled[r]![c];
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => twist(r, c)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-md border font-mono text-2xl leading-none transition-colors duration-150 active:scale-[0.96]",
                    wet ? "border-primary/50 bg-primary/15 text-primary" : "border-border bg-surface text-muted",
                    flow.won && wet && "border-success/50 bg-success/15 text-success",
                  )}
                >
                  {glyph(cell)}
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
