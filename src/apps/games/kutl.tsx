import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { GameOver, GameHud } from "@/components/game-hud";
import {
  BOARD,
  anyFits,
  bounds,
  canPlace,
  dealTrio,
  emptyBoard,
  place,
  rotateShape,
  scoreGain,
  type Board,
  type Piece,
} from "@/lib/games/kutl";
import { buzz, sfx } from "@/lib/games/sfx";
import { t } from "@/lib/i18n";
import { readScore, writeScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

export function KutlApp() {
  const lang = useAppStore((s) => s.lang);
  const [board, setBoard] = useState<Board>(() => emptyBoard());
  const [pieces, setPieces] = useState<(Piece | null)[]>(() => dealTrio());
  const [sel, setSel] = useState(0);
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => (typeof window === "undefined" ? 0 : readScore("kutl")));
  const [over, setOver] = useState(false);
  const selected = pieces[sel];

  const preview = useMemo(() => {
    if (!selected || !hover) return null;
    return canPlace(board, selected.cells, hover.r, hover.c);
  }, [selected, hover, board]);

  function restart() {
    setBoard(emptyBoard());
    setPieces(dealTrio());
    setSel(0);
    setScore(0);
    setOver(false);
    setHover(null);
  }

  function spin() {
    if (!selected) return;
    sfx.tap();
    setPieces((cur) => cur.map((p, i) => (i === sel && p ? { ...p, cells: rotateShape(p.cells) } : p)));
  }

  function drop(r: number, c: number) {
    if (over || !selected) return;
    if (!canPlace(board, selected.cells, r, c)) {
      sfx.miss();
      return;
    }
    const res = place(board, selected.cells, r, c);
    const gain = scoreGain(res.cells, res.cleared);
    const nextScore = score + gain;
    setBoard(res.board);
    setScore(nextScore);
    const b = writeScore("kutl", nextScore);
    setBest(b);
    if (res.cleared) {
      sfx.clear();
      buzz(12);
    } else {
      sfx.place();
      buzz(7);
    }
    const nextPieces = pieces.map((p, i) => (i === sel ? null : p));
    const leftover = nextPieces.some(Boolean) ? nextPieces : dealTrio();
    setPieces(leftover);
    const nextSel = leftover.findIndex(Boolean);
    setSel(nextSel < 0 ? 0 : nextSel);
    if (!anyFits(res.board, leftover)) {
      setOver(true);
      sfx.miss();
    }
  }

  return (
    <div className="space-y-4">
      <GameHud
        stats={[
          { label: t(lang, "score"), value: score },
          { label: t(lang, "best"), value: best },
        ]}
      >
        <Button size="sm" variant="secondary" onClick={restart}>
          {t(lang, "newGame")}
        </Button>
      </GameHud>
      <p className="text-sm text-muted">
        {lang === "ar"
          ? "ضع الكتل على اللوحة. الصف أو العمود الممتلئ يُمسح."
          : "Place blocks on the board. A full row or column clears."}
      </p>
      <div className="relative mx-auto w-full max-w-md">
        <div
          className="grid gap-1 touch-manipulation"
          style={{ gridTemplateColumns: `repeat(${BOARD}, minmax(0, 1fr))` }}
          onPointerLeave={() => setHover(null)}
        >
          {board.flatMap((row, r) =>
            row.map((cell, c) => {
              const ghost =
                selected && hover && selected.cells.some(([dr, dc]) => hover.r + dr === r && hover.c + dc === c);
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onPointerEnter={() => setHover({ r, c })}
                  onClick={() => drop(r, c)}
                  className={cn(
                    "aspect-square rounded-sm border",
                    cell
                      ? "border-primary/30 bg-primary/70"
                      : ghost
                        ? preview
                          ? "border-primary bg-primary/25"
                          : "border-danger/40 bg-danger/15"
                        : "border-border bg-surface-2",
                  )}
                />
              );
            }),
          )}
        </div>
        {over ? (
          <GameOver title={t(lang, "gameOver")} body={lang === "ar" ? `النقاط ${score}` : `Score ${score}`}>
            <Button onClick={restart}>{t(lang, "newGame")}</Button>
          </GameOver>
        ) : null}
      </div>
      <div className="flex items-end justify-center gap-3">
        {pieces.map((p, i) => (
          <button
            key={p?.id ?? `empty-${i}`}
            type="button"
            disabled={!p}
            onClick={() => {
              if (!p) return;
              sfx.tap();
              setSel(i);
            }}
            className={cn(
              "flex h-24 w-24 items-center justify-center rounded-xl border",
              sel === i ? "border-primary bg-surface-2" : "border-border bg-surface",
              !p && "opacity-30",
            )}
          >
            {p ? <Mini piece={p} /> : null}
          </button>
        ))}
      </div>
      <div className="flex justify-center">
        <Button variant="outline" onClick={spin} disabled={!selected}>
          {lang === "ar" ? "تدوير الكتلة" : "Rotate block"}
        </Button>
      </div>
    </div>
  );
}

function Mini({ piece }: { piece: Piece }) {
  const { h, w } = bounds(piece.cells);
  return (
    <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${w}, 12px)` }}>
      {Array.from({ length: h * w }, (_, i) => {
        const r = Math.floor(i / w);
        const c = i % w;
        const on = piece.cells.some(([rr, cc]) => rr === r && cc === c);
        return <span key={i} className={cn("size-3 rounded-[2px]", on ? "bg-primary" : "bg-transparent")} />;
      })}
    </div>
  );
}
