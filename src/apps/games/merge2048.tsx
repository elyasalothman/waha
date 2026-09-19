import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RoundOverlay } from "@/components/round-overlay";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { readScore, writeScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Board = number[][];

function emptyBoard(): Board {
  return Array.from({ length: 4 }, () => [0, 0, 0, 0]);
}

function clone(b: Board): Board {
  return b.map((r) => [...r]);
}

function empties(b: Board): { r: number; c: number }[] {
  const out: { r: number; c: number }[] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (b[r]![c] === 0) out.push({ r, c });
  return out;
}

function addRandom(b: Board): Board {
  const spots = empties(b);
  if (spots.length === 0) return b;
  const next = clone(b);
  const spot = spots[Math.floor(Math.random() * spots.length)]!;
  next[spot.r]![spot.c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function slideRow(row: number[]): { row: number[]; gained: number } {
  const tiles = row.filter((n) => n !== 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < tiles.length; i++) {
    const a = tiles[i]!;
    if (i + 1 < tiles.length && a === tiles[i + 1]) {
      out.push(a * 2);
      gained += a * 2;
      i++;
    } else out.push(a);
  }
  while (out.length < 4) out.push(0);
  return { row: out, gained };
}

function moveBoard(b: Board, dir: "L" | "R" | "U" | "D"): { board: Board; gained: number; changed: boolean } {
  const next = clone(b);
  let gained = 0;
  const apply = (r: number, c: number, v: number) => {
    next[r]![c] = v;
  };
  if (dir === "L" || dir === "R") {
    for (let r = 0; r < 4; r++) {
      const src = dir === "L" ? [...next[r]!] : [...next[r]!].reverse();
      const slid = slideRow(src);
      const row = dir === "L" ? slid.row : [...slid.row].reverse();
      row.forEach((v, c) => apply(r, c, v));
      gained += slid.gained;
    }
  } else {
    for (let c = 0; c < 4; c++) {
      const src = [];
      for (let r = 0; r < 4; r++) src.push(next[r]![c]!);
      const col = dir === "U" ? src : src.reverse();
      const slid = slideRow(col);
      const res = dir === "U" ? slid.row : [...slid.row].reverse();
      res.forEach((v, r) => apply(r, c, v));
      gained += slid.gained;
    }
  }
  const changed = next.some((row, r) => row.some((v, c) => v !== b[r]![c]));
  return { board: next, gained, changed };
}

function canMove(b: Board): boolean {
  if (empties(b).length > 0) return true;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v = b[r]![c]!;
      if (c < 3 && b[r]![c + 1] === v) return true;
      if (r < 3 && b[r + 1]![c] === v) return true;
    }
  }
  return false;
}

function has2048(b: Board) {
  return b.some((row) => row.some((n) => n >= 2048));
}

function tileClass(n: number): string {
  if (n <= 2) return "bg-surface-2 text-muted";
  if (n <= 4) return "bg-surface-2 text-fg";
  if (n <= 8) return "bg-primary/20 text-fg";
  if (n <= 16) return "bg-primary/30 text-fg";
  if (n <= 32) return "bg-primary/40 text-fg";
  if (n <= 64) return "bg-primary/50 text-primary-fg";
  if (n <= 128) return "bg-primary/70 text-primary-fg";
  if (n <= 256) return "bg-primary text-primary-fg";
  if (n <= 512) return "bg-success text-fg";
  if (n <= 1024) return "bg-warn text-fg";
  return "bg-primary text-primary-fg";
}

export function Merge2048App() {
  const lang = useAppStore((s) => s.lang);
  const [board, setBoard] = useState<Board>(() => addRandom(addRandom(emptyBoard())));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [won, setWon] = useState(false);
  const [continued, setContinued] = useState(false);
  const [over, setOver] = useState(false);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setBest(readScore("merge2048"));
  }, []);

  const applyMove = useCallback(
    (dir: "L" | "R" | "U" | "D") => {
      if (over) return;
      if (won && !continued) return;
      const res = moveBoard(board, dir);
      if (!res.changed) return;
      const next = addRandom(res.board);
      const nextScore = score + res.gained;
      setBoard(next);
      setScore(nextScore);
      const b = writeScore("merge2048", nextScore);
      setBest(b);
      if (!continued && has2048(next)) setWon(true);
      if (!canMove(next)) setOver(true);
    },
    [board, score, over, won, continued],
  );

  const newGame = () => {
    setBoard(addRandom(addRandom(emptyBoard())));
    setScore(0);
    setWon(false);
    setContinued(false);
    setOver(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, "L" | "R" | "U" | "D"> = {
        ArrowLeft: "L",
        ArrowRight: "R",
        ArrowUp: "U",
        ArrowDown: "D",
        KeyA: "L",
        KeyD: "R",
        KeyW: "U",
        KeyS: "D",
      };
      const d = map[e.code];
      if (!d) return;
      e.preventDefault();
      applyMove(d);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyMove]);

  const onPointerDown = (e: React.PointerEvent) => {
    swipeRef.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = swipeRef.current;
    swipeRef.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.hypot(dx, dy) < 28) return;
    if (Math.abs(dx) > Math.abs(dy)) applyMove(dx > 0 ? "R" : "L");
    else applyMove(dy > 0 ? "D" : "U");
  };

  const peak = board.flat().reduce((m, n) => Math.max(m, n), 0);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label={t(lang, "score")} value={score} />
        <Stat label={t(lang, "best")} value={best} />
        <Stat label={L("أعلى", "Peak")} value={peak || "—"} />
      </div>
      <Card
        className="relative p-3 touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          swipeRef.current = null;
        }}
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          {board.flatMap((row, r) =>
            row.map((n, c) => (
              <div
                key={`${r}-${c}`}
                className={cn(
                  "flex aspect-square min-h-11 items-center justify-center rounded-md text-lg font-semibold tabular-nums sm:text-2xl",
                  n === 0 ? "bg-surface-2 text-subtle" : tileClass(n),
                )}
              >
                {n || ""}
              </div>
            )),
          )}
        </div>
        {over || (won && !continued) ? (
          <RoundOverlay
            title={over ? t(lang, "gameOver") : t(lang, "youWin")}
            detail={`${t(lang, "score")} ${score} · ${peak}`}
            actionLabel={over ? t(lang, "restart") : t(lang, "resume")}
            onAction={
              over
                ? newGame
                : () => {
                    setContinued(true);
                    setWon(true);
                  }
            }
            extra={
              over ? null : (
                <Button variant="secondary" onClick={newGame}>
                  {t(lang, "newGame")}
                </Button>
              )
            }
          />
        ) : null}
      </Card>
      <Button variant="outline" onClick={newGame}>
        {t(lang, "newGame")}
      </Button>
    </div>
  );
}
