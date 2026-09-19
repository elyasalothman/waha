import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RoundOverlay } from "@/components/round-overlay";
import { Stat } from "@/components/app-stage";
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

function winningLine(b: Cell[]): number[] | null {
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
  for (const line of lines) {
    const [a, c, d] = line;
    if (b[a!] && b[a!] === b[c!] && b[a!] === b[d!]) return line;
  }
  return null;
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
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [draws, setDraws] = useState(0);
  const w = winner(board);
  const line = winningLine(board);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  function resetBoard() {
    setBoard(Array(9).fill(null));
  }

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
    if (end === "X") {
      setWins((n) => n + 1);
      writeScore("xo", 1);
    } else if (end === "O") setLosses((n) => n + 1);
    else if (end === "draw") setDraws((n) => n + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={diff === "easy" ? "default" : "secondary"}
          onClick={() => {
            setDiff("easy");
            resetBoard();
          }}
        >
          {t(lang, "easy")}
        </Button>
        <Button
          size="sm"
          variant={diff === "hard" ? "default" : "secondary"}
          onClick={() => {
            setDiff("hard");
            resetBoard();
          }}
        >
          {t(lang, "hard")}
        </Button>
        <Button size="sm" variant="outline" onClick={resetBoard}>
          {t(lang, "newGame")}
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label={L("فوز", "Wins")} value={wins} />
        <Stat label={L("تعادل", "Draws")} value={draws} />
        <Stat label={L("خسارة", "Losses")} value={losses} />
      </div>
      <div className="relative mx-auto max-w-xs">
        <div className="grid grid-cols-3 gap-2">
          {board.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => play(i)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg border border-border bg-surface font-display text-4xl transition-colors duration-150",
                c === "X" && "text-primary",
                c === "O" && "text-muted",
                line?.includes(i) && "border-primary bg-surface-2",
              )}
            >
              {c ?? ""}
            </button>
          ))}
        </div>
        {w ? (
          <RoundOverlay
            title={w === "X" ? t(lang, "youWin") : w === "O" ? L("فاز الخصم", "Waha wins") : L("تعادل", "Draw")}
            detail={L("جولة جديدة متى شئت.", "A new round whenever you like.")}
            actionLabel={t(lang, "restart")}
            onAction={resetBoard}
          />
        ) : null}
      </div>
      {!w ? <p className="text-center text-sm text-muted">{L("دورك أنت X", "You are X")}</p> : null}
    </div>
  );
}
