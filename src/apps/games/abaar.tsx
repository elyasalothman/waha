import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { ABAAR_N, ABAAR_PITS, abaarOpened, abaarSafeCount, abaarWon, buildAbaar, emptyAbaar, floodAbaar, toggleAbaarFlag, type AbaarCell, type AbaarGrid } from "@/lib/games/abaar";
import { playSfx } from "@/lib/sfx";
import { readScore, writeBestMin } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

export function AbaarApp() {
  const lang = useAppStore((s) => s.lang);
  const [grid, setGrid] = useState<AbaarGrid>(emptyAbaar);
  const [started, setStarted] = useState(false);
  const [dead, setDead] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [best, setBest] = useState(0);
  const tick = useRef<number>(0);
  const won = started && !dead && abaarWon(grid);

  useEffect(() => {
    setBest(readScore("abaar"));
  }, []);

  useEffect(() => {
    if (!started || dead || won) {
      window.clearInterval(tick.current);
      return;
    }
    tick.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(tick.current);
  }, [started, dead, won]);

  useEffect(() => {
    if (won && seconds > 0) {
      playSfx("win");
      setBest(writeBestMin("abaar", seconds));
    }
  }, [won, seconds]);

  function reset() {
    setGrid(emptyAbaar());
    setStarted(false);
    setDead(false);
    setSeconds(0);
    setFlagMode(false);
  }

  function labelCell(cell: AbaarCell) {
    if (cell.flag && !cell.open) return lang === "ar" ? "حفرة معلّمة" : "Marked pit";
    if (!cell.open) return lang === "ar" ? "رمل" : "Sand";
    if (cell.pit) return lang === "ar" ? "حفرة جافة" : "Dry pit";
    if (!cell.n) return lang === "ar" ? "بئر مفتوح" : "Open well";
    return lang === "ar" ? `${cell.n} حفر حولك` : `${cell.n} nearby pits`;
  }

  function openCell(r: number, c: number) {
    if (dead || won) return;
    if (!started) {
      const next = floodAbaar(buildAbaar(r, c), r, c);
      setGrid(next);
      setStarted(true);
      playSfx("place");
      return;
    }
    const cell = grid[r]![c]!;
    if (cell.open || cell.flag) return;
    if (flagMode) {
      playSfx("tap");
      setGrid(toggleAbaarFlag(grid, r, c));
      return;
    }
    if (cell.pit) {
      playSfx("miss");
      setDead(true);
      setGrid(grid.map((row) => row.map((x) => (x.pit ? { ...x, open: true } : x))));
      return;
    }
    playSfx(cell.n === 0 ? "clear" : "tap");
    setGrid(floodAbaar(grid, r, c));
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={lang === "ar" ? "المفتوح" : "Opened"} value={`${abaarOpened(grid)}/${abaarSafeCount()}`} />
        <Stat label={lang === "ar" ? "الزمن" : "Time"} value={`${seconds}s`} />
        <Stat label={t(lang, "best")} value={best ? `${best}s` : "—"} />
        <Stat label={lang === "ar" ? "الحفر" : "Pits"} value={ABAAR_PITS} />
      </div>
      <p className="text-sm text-muted">
        {lang === "ar"
          ? "اكشف الرمل حتى الآبار. الرقم يقول كم حفرة جافة حولك. أول لمسة دائماً آمنة."
          : "Open the sand until the wells. The number is nearby dry pits. The first tap is always safe."}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={flagMode ? "default" : "secondary"} onClick={() => setFlagMode((v) => !v)}>
          {lang === "ar" ? "علّم حفرة" : "Mark a pit"}
        </Button>
        <Button size="sm" variant="outline" onClick={reset}>
          {t(lang, "newGame")}
        </Button>
      </div>
      <div className="mx-auto grid max-w-md gap-1.5 touch-manipulation" style={{ gridTemplateColumns: `repeat(${ABAAR_N}, minmax(0, 1fr))` }}>
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              type="button"
              aria-label={labelCell(cell)}
              onClick={() => openCell(r, c)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!started || dead || won) return;
                playSfx("tap");
                setGrid(toggleAbaarFlag(grid, r, c));
              }}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md text-sm font-medium tabular-nums transition-[background-color,transform,box-shadow] duration-150 active:scale-[0.96]",
                !cell.open && "border border-border bg-surface-2 text-warn shadow-[inset_0_1px_0_rgba(236,238,233,0.08)]",
                cell.open && !cell.pit && "border border-transparent bg-bg text-fg",
                cell.open && cell.pit && "border border-danger/50 bg-danger/20 text-danger",
                cell.open && !cell.pit && cell.n === 1 && "text-muted",
                cell.open && !cell.pit && cell.n === 2 && "text-primary",
                cell.open && !cell.pit && cell.n >= 3 && "text-warn",
              )}
            >
              {cell.flag && !cell.open ? "•" : cell.open ? (cell.pit ? "×" : cell.n || "") : ""}
            </button>
          )),
        )}
      </div>
      {dead ? <p className="text-danger">{t(lang, "gameOver")}</p> : null}
      {won ? <p className="text-success">{t(lang, "youWin")}</p> : null}
    </div>
  );
}
