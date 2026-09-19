import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RoundOverlay } from "@/components/round-overlay";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

const N = 9;
const MINES = 10;

type Cell = { mine: boolean; open: boolean; flag: boolean; n: number };

function empty(): Cell[][] {
  return Array.from({ length: N }, () =>
    Array.from({ length: N }, () => ({ mine: false, open: false, flag: false, n: 0 })),
  );
}

function recount(g: Cell[][]) {
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (g[r]![c]!.mine) continue;
      let n = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr;
          const cc = c + dc;
          if (rr >= 0 && rr < N && cc >= 0 && cc < N && g[rr]![cc]!.mine) n += 1;
        }
      g[r]![c]!.n = n;
    }
  }
}

function plant(safeR: number, safeC: number): Cell[][] {
  const g = empty();
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * N);
    const c = Math.floor(Math.random() * N);
    if (g[r]![c]!.mine) continue;
    if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
    g[r]![c]!.mine = true;
    placed += 1;
  }
  recount(g);
  return g;
}

function flood(g: Cell[][], r: number, c: number) {
  const stack = [[r, c]];
  while (stack.length) {
    const [cr, cc] = stack.pop()!;
    const cell = g[cr!]?.[cc!];
    if (!cell || cell.open || cell.flag) continue;
    cell.open = true;
    if (cell.n !== 0 || cell.mine) continue;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) stack.push([cr! + dr, cc! + dc]);
  }
}

function revealMines(g: Cell[][]) {
  for (const row of g) for (const cell of row) if (cell.mine) cell.open = true;
}

export function MinesApp() {
  const lang = useAppStore((s) => s.lang);
  const [grid, setGrid] = useState(empty);
  const [armed, setArmed] = useState(false);
  const [dead, setDead] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const [secs, setSecs] = useState(0);
  const [best, setBest] = usePersistent("waha:mines-best", 0);
  const ticking = useRef(false);
  const opened = grid.flat().filter((c) => c.open && !c.mine).length;
  const flags = grid.flat().filter((c) => c.flag).length;
  const won = !dead && armed && opened === N * N - MINES;
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  useEffect(() => {
    ticking.current = armed && !dead && !won;
  }, [armed, dead, won]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (ticking.current) setSecs((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!won || secs <= 0) return;
    if (best === 0 || secs < best) setBest(secs);
  }, [won, secs, best, setBest]);

  function deal() {
    setGrid(empty());
    setArmed(false);
    setDead(false);
    setFlagMode(false);
    setSecs(0);
  }

  function click(r: number, c: number) {
    if (dead || won) return;
    let next = grid.map((row) => row.map((cell) => ({ ...cell })));
    if (!armed) {
      next = plant(r, c);
      setArmed(true);
    }
    const cell = next[r]![c]!;
    if (flagMode) {
      if (!cell.open) cell.flag = !cell.flag;
      setGrid(next);
      return;
    }
    if (cell.flag) return;
    if (cell.mine) {
      revealMines(next);
      setGrid(next);
      setDead(true);
      return;
    }
    flood(next, r, c);
    setGrid(next);
  }

  const ended = dead || won;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={L("المتبقي", "Left")} value={Math.max(0, MINES - flags)} />
        <Stat label={L("الوقت", "Time")} value={secs} />
        <Stat label={t(lang, "best")} value={best || "—"} />
        <Stat label={L("المفتوح", "Opened")} value={`${opened}/${N * N - MINES}`} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={flagMode ? "default" : "secondary"} onClick={() => setFlagMode((v) => !v)}>
          {L("علم", "Flag")}
        </Button>
        <Button size="sm" variant="outline" onClick={deal}>
          {t(lang, "newGame")}
        </Button>
      </div>
      <div className="relative mx-auto max-w-sm">
        <div className="grid grid-cols-9 gap-0.5">
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => click(r, c)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (dead || won) return;
                  const next = grid.map((rw) => rw.map((cell) => ({ ...cell })));
                  const cell = next[r]![c]!;
                  if (!cell.open) cell.flag = !cell.flag;
                  setGrid(next);
                }}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-sm border text-xs tabular-nums",
                  cell.open ? "border-border bg-surface-2" : "border-border bg-surface",
                  cell.open && cell.mine && "bg-danger/30 text-danger",
                  cell.open && !cell.mine && cell.n > 0 && "text-primary",
                )}
              >
                {cell.flag && !cell.open ? "!" : cell.open ? (cell.mine ? "×" : cell.n || "") : ""}
              </button>
            )),
          )}
        </div>
        {ended ? (
          <RoundOverlay
            title={won ? t(lang, "youWin") : t(lang, "gameOver")}
            detail={won ? L(`في ${secs} ثانية`, `In ${secs}s`) : L("أول نقرة آمنة في الجولة التالية.", "The first tap is safe next round.")}
            actionLabel={t(lang, "restart")}
            onAction={deal}
          />
        ) : null}
      </div>
      {!armed ? <p className="text-center text-sm text-muted">{L("أول نقرة آمنة — ثم اكشف الحقل.", "The first tap is safe — then clear the field.")}</p> : null}
    </div>
  );
}
