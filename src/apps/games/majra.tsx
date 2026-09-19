import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { GameHud } from "@/components/game-hud";
import { generateLevel, openings, rotateCell, wetCells, type Cell } from "@/lib/games/majra";
import { buzz, sfx } from "@/lib/games/sfx";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { writeScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

function deal(level: number) {
  return generateLevel(level, level * 4243 + (Date.now() % 1021));
}

function Pipe({ cell, wet }: { cell: Cell; wet: boolean }) {
  const dirs = openings(cell);
  const stroke = wet ? "var(--color-primary)" : "var(--color-muted)";
  return (
    <svg viewBox="0 0 40 40" className="size-full">
      <rect x="1" y="1" width="38" height="38" rx="6" fill="var(--color-surface)" stroke="var(--color-border)" />
      {cell.kind !== "empty" ? <circle cx="20" cy="20" r="4.2" fill={stroke} /> : null}
      {dirs.includes("N") ? <path d="M20 20 V4" stroke={stroke} strokeWidth="5" strokeLinecap="round" /> : null}
      {dirs.includes("E") ? <path d="M20 20 H36" stroke={stroke} strokeWidth="5" strokeLinecap="round" /> : null}
      {dirs.includes("S") ? <path d="M20 20 V36" stroke={stroke} strokeWidth="5" strokeLinecap="round" /> : null}
      {dirs.includes("W") ? <path d="M20 20 H4" stroke={stroke} strokeWidth="5" strokeLinecap="round" /> : null}
      {cell.kind === "source" ? <circle cx="20" cy="20" r="6" fill="var(--color-success)" /> : null}
      {cell.kind === "sink" ? <circle cx="20" cy="20" r="6" fill="var(--color-warn)" /> : null}
    </svg>
  );
}

export function MajraApp() {
  const lang = useAppStore((s) => s.lang);
  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState(() => deal(1).grid);
  const [turns, setTurns] = useState(0);
  const [best, setBest] = usePersistent("waha:majra-best", 0);
  const flow = useMemo(() => wetCells(grid), [grid]);

  function rotate(x: number, y: number) {
    if (flow.won) return;
    const cell = grid[y]![x]!;
    if (cell.kind === "source" || cell.kind === "sink" || cell.kind === "empty") return;
    sfx.tap();
    const next = grid.map((row, ry) => row.map((c, cx) => (ry === y && cx === x ? rotateCell(c) : c)));
    setGrid(next);
    setTurns((n) => n + 1);
    const res = wetCells(next);
    if (res.won) {
      sfx.win();
      buzz(16);
      if (level > best) setBest(level);
      writeScore("majra", level);
    } else {
      buzz(6);
    }
  }

  function nextLevel() {
    const n = level + 1;
    setLevel(n);
    setGrid(deal(n).grid);
    setTurns(0);
    sfx.ok();
  }

  function restart() {
    setGrid(deal(level).grid);
    setTurns(0);
  }

  return (
    <div className="space-y-4">
      <GameHud
        stats={[
          { label: t(lang, "level"), value: level },
          { label: lang === "ar" ? "اللفّات" : "Turns", value: turns },
          { label: t(lang, "best"), value: best || "—" },
        ]}
      >
        <Button size="sm" variant="secondary" onClick={restart}>
          {t(lang, "restart")}
        </Button>
      </GameHud>
      <p className="text-sm text-muted">
        {lang === "ar"
          ? "أدر المجاري حتى يصل الماء من العين إلى المصب."
          : "Turn the channels until water runs from the spring to the mouth."}
      </p>
      <div className="mx-auto w-full max-w-md">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${grid[0]?.length ?? 4}, minmax(0, 1fr))` }}
        >
          {grid.flatMap((row, y) =>
            row.map((cell, x) => (
              <button
                key={`${x}-${y}`}
                type="button"
                onClick={() => rotate(x, y)}
                className={cn(
                  "aspect-square rounded-md p-0.5 touch-manipulation",
                  flow.wet.has(`${x},${y}`) && "ring-1 ring-primary/40",
                )}
              >
                <Pipe cell={cell} wet={flow.wet.has(`${x},${y}`)} />
              </button>
            )),
          )}
        </div>
      </div>
      {flow.won ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <p className="text-success">{t(lang, "youWin")}</p>
          <Button onClick={nextLevel}>{lang === "ar" ? "المجرى التالي" : "Next stream"}</Button>
        </div>
      ) : null}
    </div>
  );
}
