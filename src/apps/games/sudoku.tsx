import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RoundOverlay } from "@/components/round-overlay";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Grid = number[][];
type Diff = "easy" | "medium" | "hard";

function empty(): Grid {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function clone(g: Grid): Grid {
  return g.map((r) => [...r]);
}

function ok(g: Grid, r: number, c: number, n: number) {
  for (let i = 0; i < 9; i++) if (g[r]![i] === n || g[i]![c] === n) return false;
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (g[br + i]![bc + j] === n) return false;
  return true;
}

function fill(g: Grid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (g[r]![c] !== 0) continue;
      const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
      for (const n of nums) {
        if (!ok(g, r, c, n)) continue;
        g[r]![c] = n;
        if (fill(g)) return true;
        g[r]![c] = 0;
      }
      return false;
    }
  }
  return true;
}

function countSolutions(g: Grid, cap = 2): number {
  let n = 0;
  const walk = (): boolean => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (g[r]![c] !== 0) continue;
        for (let v = 1; v <= 9; v++) {
          if (!ok(g, r, c, v)) continue;
          g[r]![c] = v;
          if (walk()) return true;
          g[r]![c] = 0;
        }
        return false;
      }
    }
    n += 1;
    return n >= cap;
  };
  walk();
  return n;
}

function puzzle(diff: Diff): { given: Grid; solved: Grid } {
  const solved = empty();
  fill(solved);
  const given = clone(solved);
  const holes = diff === "easy" ? 36 : diff === "medium" ? 46 : 54;
  const cells = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5);
  let removed = 0;
  for (const cell of cells) {
    if (removed >= holes) break;
    const r = Math.floor(cell / 9);
    const c = cell % 9;
    const bak = given[r]![c]!;
    given[r]![c] = 0;
    const test = clone(given);
    if (countSolutions(test, 2) !== 1) given[r]![c] = bak;
    else removed += 1;
  }
  return { given, solved };
}

export function SudokuApp() {
  const lang = useAppStore((s) => s.lang);
  const [diff, setDiff] = useState<Diff>("easy");
  const [{ given, solved }, setPack] = useState(() => puzzle("easy"));
  const [grid, setGrid] = useState<Grid>(() => clone(given));
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const [msg, setMsg] = useState("");
  const [secs, setSecs] = useState(0);
  const [won, setWon] = useState(false);
  const [best, setBest] = usePersistent("waha:sudoku-best", 0);
  const ticking = useRef(true);

  function deal(d: Diff) {
    const p = puzzle(d);
    setDiff(d);
    setPack(p);
    setGrid(clone(p.given));
    setSel(null);
    setMsg("");
    setSecs(0);
    setWon(false);
    ticking.current = true;
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      if (ticking.current) setSecs((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const filled = useMemo(() => grid.flat().every((n) => n !== 0), [grid]);
  const complete = filled && grid.every((row, r) => row.every((n, c) => n === solved[r]![c]));

  useEffect(() => {
    if (!complete || won) return;
    ticking.current = false;
    setWon(true);
    setMsg(t(lang, "youWin"));
    if (best === 0 || secs < best) setBest(secs);
  }, [complete, won, lang, best, secs, setBest]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["easy", "medium", "hard"] as const).map((d) => (
          <Button key={d} size="sm" variant={diff === d ? "default" : "secondary"} onClick={() => deal(d)}>
            {t(lang, d)}
          </Button>
        ))}
        <Button size="sm" variant="outline" onClick={() => deal(diff)}>
          {t(lang, "newGame")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const good = grid.every((row, r) => row.every((n, c) => n === 0 || n === solved[r]![c]));
            setMsg(good ? (filled ? t(lang, "youWin") : lang === "ar" ? "صحيح حتى الآن" : "Correct so far") : lang === "ar" ? "هناك أخطاء" : "There are mistakes");
          }}
        >
          {lang === "ar" ? "تحقق" : "Check"}
        </Button>
        <Stat label={lang === "ar" ? "الوقت" : "Time"} value={secs} />
        <Stat label={t(lang, "best")} value={best || "—"} />
      </div>
      <div className="relative mx-auto max-w-md">
      <div className="grid grid-cols-9 overflow-hidden rounded-lg border border-border">
        {grid.map((row, r) =>
          row.map((n, c) => {
            const locked = given[r]![c] !== 0;
            const same = sel && grid[sel.r]![sel.c] !== 0 && n === grid[sel.r]![sel.c];
            const wrong = !locked && n !== 0 && n !== solved[r]![c];
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => setSel({ r, c })}
                className={cn(
                  "aspect-square border-e border-b border-border text-sm tabular-nums",
                  c % 3 === 2 && c !== 8 && "border-e-2 border-e-muted",
                  r % 3 === 2 && r !== 8 && "border-b-2 border-b-muted",
                  locked ? "font-medium text-fg" : "text-primary",
                  sel?.r === r && sel?.c === c && "bg-surface-2",
                  same && "bg-surface-2",
                  wrong && "text-danger",
                )}
              >
                {n || ""}
              </button>
            );
          }),
        )}
      </div>
      {won ? (
        <RoundOverlay
          title={t(lang, "youWin")}
          detail={lang === "ar" ? `في ${secs} ثانية` : `In ${secs}s`}
          actionLabel={t(lang, "newGame")}
          onAction={() => deal(diff)}
        />
      ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
          <Button
            key={n}
            variant="secondary"
            className="min-w-11"
            onClick={() => {
              if (!sel || given[sel.r]![sel.c] !== 0) return;
              setGrid((g) => {
                const next = clone(g);
                next[sel.r]![sel.c] = n;
                return next;
              });
            }}
          >
            {n === 0 ? (lang === "ar" ? "مسح" : "Clear") : n}
          </Button>
        ))}
      </div>
      {msg ? <Stat label={lang === "ar" ? "الحالة" : "Status"} value={msg} /> : null}
    </div>
  );
}
