import { useState } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { writeScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Cell = "X" | "O" | null;
type Diff = "easy" | "hard";

function winner(b: Cell[]): Cell | "draw" | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, c, d] of lines) if (b[a!] && b[a!] === b[c!] && b[a!] === b[d!]) return b[a!]!;
  return b.every(Boolean) ? "draw" : null;
}

function minimax(b: Cell[], ai: boolean): { score: number; i: number } {
  const w = winner(b);
  if (w === "O") return { score: 1, i: -1 };
  if (w === "X") return { score: -1, i: -1 };
  if (w === "draw") return { score: 0, i: -1 };
  let best = { score: ai ? -2 : 2, i: -1 };
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = ai ? "O" : "X";
    const res = minimax(b, !ai);
    b[i] = null;
    if (ai ? res.score > best.score : res.score < best.score) best = { score: res.score, i };
  }
  return best;
}

function aiMove(b: Cell[], diff: Diff): number {
  const empty = b.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  if (diff === "easy" && Math.random() < 0.7) return empty[Math.floor(Math.random() * empty.length)]!;
  return minimax([...b], true).i;
}

export function XoApp() {
  const lang = useAppStore((s) => s.lang);
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [diff, setDiff] = useState<Diff>("hard");
  const w = winner(board);

  function play(i: number) {
    if (board[i] || w) return;
    const next = [...board];
    next[i] = "X";
    const after = winner(next);
    if (!after) {
      const j = aiMove(next, diff);
      if (j >= 0) next[j] = "O";
    }
    setBoard(next);
    const end = winner(next);
    if (end === "X") writeScore("xo", 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" variant={diff === "easy" ? "default" : "secondary"} onClick={() => setDiff("easy")}>
          {t(lang, "easy")}
        </Button>
        <Button size="sm" variant={diff === "hard" ? "default" : "secondary"} onClick={() => setDiff("hard")}>
          {t(lang, "hard")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setBoard(Array(9).fill(null))}>
          {t(lang, "newGame")}
        </Button>
      </div>
      <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
        {board.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => play(i)}
            className={cn(
              "flex aspect-square items-center justify-center rounded-lg border border-border bg-surface font-display text-4xl",
              c === "X" && "text-primary",
              c === "O" && "text-muted",
            )}
          >
            {c ?? ""}
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-muted">
        {w === "X" ? t(lang, "youWin") : w === "O" ? t(lang, "gameOver") : w === "draw" ? (lang === "ar" ? "تعادل" : "Draw") : lang === "ar" ? "دورك أنت X" : "You are X"}
      </p>
    </div>
  );
}
