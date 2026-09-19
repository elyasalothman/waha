import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import {
  KUTAL_N,
  canPlaceKutal,
  clearKutalLines,
  dealKutalHand,
  emptyKutal,
  kutalDead,
  kutalPlaceScore,
  pieceBounds,
  placeKutal,
  type KutalBoard,
  type KutalPiece,
} from "@/lib/games/kutal";
import { playSfx } from "@/lib/sfx";
import { readScore, writeScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

export function KutalApp() {
  const lang = useAppStore((s) => s.lang);
  const [board, setBoard] = useState<KutalBoard>(emptyKutal);
  const [hand, setHand] = useState<(KutalPiece | null)[]>(() => dealKutalHand());
  const [pick, setPick] = useState<number | null>(0);
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const piece = pick != null ? hand[pick] : null;
  const dead = kutalDead(board, hand);

  useEffect(() => {
    setBest(readScore("kutal"));
  }, []);

  useEffect(() => {
    if (dead) playSfx("miss");
  }, [dead]);

  const preview = useMemo(() => {
    if (!piece || !hover) return null;
    return canPlaceKutal(board, piece, hover.r, hover.c);
  }, [board, piece, hover]);

  function reset() {
    setBoard(emptyKutal());
    setHand(dealKutalHand());
    setPick(0);
    setHover(null);
    setScore(0);
  }

  function drop(r: number, c: number) {
    if (dead || !piece || pick == null) return;
    const placed = placeKutal(board, piece, r, c, 1 + (pick % 3));
    if (!placed) {
      playSfx("miss");
      return;
    }
    const { board: cleared, cleared: n } = clearKutalLines(placed);
    const gained = kutalPlaceScore(piece.cells.length, n);
    const nextScore = score + gained;
    setBoard(cleared);
    setScore(nextScore);
    setBest(writeScore("kutal", nextScore));
    playSfx(n > 0 ? "clear" : "place");
    const nextHand = hand.map((p, i) => (i === pick ? null : p));
    const empty = nextHand.every((p) => p == null);
    const dealt = empty ? dealKutalHand() : nextHand;
    setHand(dealt);
    setPick(dealt.findIndex((p) => p != null));
    setHover(null);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Stat label={t(lang, "score")} value={score} />
        <Stat label={t(lang, "best")} value={best || "—"} />
      </div>
      <p className="text-sm text-muted">
        {lang === "ar"
          ? "ضع الكتلة على اللوح. الصف أو العمود الممتلئ يُمسح. لا تترك نفسك بلا موضع."
          : "Place a block on the board. A full row or column clears. Don’t leave yourself nowhere to go."}
      </p>
      <div
        className="mx-auto grid max-w-sm gap-1 touch-manipulation"
        style={{ gridTemplateColumns: `repeat(${KUTAL_N}, minmax(0, 1fr))` }}
      >
        {board.map((row, r) =>
          row.map((v, c) => {
            const ghost =
              piece && hover
                ? piece.cells.some(([dr, dc]) => hover.r + dr === r && hover.c + dc === c)
                : false;
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onPointerEnter={() => setHover({ r, c })}
                onPointerDown={() => {
                  setHover({ r, c });
                  drop(r, c);
                }}
                className={cn(
                  "aspect-square rounded-sm border transition-colors duration-150",
                  v
                    ? "border-primary/50 bg-primary/85"
                    : ghost && preview
                      ? "border-primary/50 bg-primary/30"
                      : ghost
                        ? "border-danger/40 bg-danger/15"
                        : "border-border bg-surface-2",
                )}
              />
            );
          }),
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {hand.map((p, i) => {
          const { h, w } = p ? pieceBounds(p) : { h: 1, w: 1 };
          return (
            <button
              key={i}
              type="button"
              disabled={!p}
              onClick={() => {
                if (!p) return;
                playSfx("tap");
                setPick(i);
              }}
              className={cn(
                "flex min-h-20 items-center justify-center rounded-xl border p-2",
                pick === i ? "border-primary bg-surface-2" : "border-border bg-surface",
                !p && "opacity-30",
              )}
            >
              {p ? (
                <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${w}, 12px)`, gridTemplateRows: `repeat(${h}, 12px)` }}>
                  {Array.from({ length: h * w }).map((_, n) => {
                    const rr = Math.floor(n / w);
                    const cc = n % w;
                    const on = p.cells.some(([a, b]) => a === rr && b === cc);
                    return <span key={n} className={cn("rounded-[2px]", on ? "bg-primary" : "bg-transparent")} />;
                  })}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
      {dead ? <p className="text-danger">{t(lang, "gameOver")}</p> : null}
      <Button variant="outline" onClick={reset}>
        {t(lang, "newGame")}
      </Button>
    </div>
  );
}
