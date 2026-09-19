import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RoundOverlay } from "@/components/round-overlay";
import { Seg } from "@/components/seg";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { writeScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

type Cell = 0 | 1 | 2;
type Mode = "ai" | "hot";

const ROWS = 6;
const COLS = 7;

function empty(): Cell[] {
  return Array(ROWS * COLS).fill(0);
}

function idx(r: number, c: number) {
  return r * COLS + c;
}

function winner(b: Cell[]): 1 | 2 | "draw" | null {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = b[idx(r, c)];
      if (!v) continue;
      for (const [dr, dc] of dirs) {
        let n = 1;
        for (let k = 1; k < 4; k++) {
          const rr = r + dr * k;
          const cc = c + dc * k;
          if (rr < 0 || cc < 0 || rr >= ROWS || cc >= COLS || b[idx(rr, cc)] !== v) break;
          n++;
        }
        if (n >= 4) return v as 1 | 2;
      }
    }
  }
  return b.every(Boolean) ? "draw" : null;
}

function drop(b: Cell[], col: number, who: 1 | 2): Cell[] | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!b[idx(r, col)]) {
      const n = [...b];
      n[idx(r, col)] = who;
      return n;
    }
  }
  return null;
}

function scoreBoard(b: Cell[], who: 1 | 2) {
  const w = winner(b);
  if (w === who) return 1000;
  if (w && w !== "draw") return -1000;
  return 0;
}

function minimax(b: Cell[], depth: number, maximizing: boolean, alpha: number, beta: number): number {
  const w = winner(b);
  if (w === 2) return 1000 + depth;
  if (w === 1) return -1000 - depth;
  if (w === "draw" || depth === 0) return scoreBoard(b, 2);
  if (maximizing) {
    let best = -1e9;
    for (let c = 0; c < COLS; c++) {
      const n = drop(b, c, 2);
      if (!n) continue;
      best = Math.max(best, minimax(n, depth - 1, false, alpha, beta));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = 1e9;
  for (let c = 0; c < COLS; c++) {
    const n = drop(b, c, 1);
    if (!n) continue;
    best = Math.min(best, minimax(n, depth - 1, true, alpha, beta));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

function aiMove(b: Cell[]): number {
  let best = -1e9;
  let choice = 3;
  const order = [3, 2, 4, 1, 5, 0, 6];
  for (const c of order) {
    const n = drop(b, c, 2);
    if (!n) continue;
    const s = minimax(n, 4, false, -1e9, 1e9);
    if (s > best) {
      best = s;
      choice = c;
    }
  }
  return choice;
}

export function Connect4App() {
  const lang = useAppStore((s) => s.lang);
  const [board, setBoard] = useState<Cell[]>(empty);
  const [mode, setMode] = useState<Mode>("ai");
  const [turn, setTurn] = useState<1 | 2>(1);
  const [you, setYou] = useState(0);
  const [them, setThem] = useState(0);
  const w = useMemo(() => winner(board), [board]);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  function play(col: number) {
    if (w) return;
    const next = drop(board, col, turn);
    if (!next) return;
    setBoard(next);
    const end = winner(next);
    if (end === 1) {
      setYou((n) => n + 1);
      writeScore("connect4", 1);
    } else if (end === 2) setThem((n) => n + 1);
    if (end || mode === "hot") {
      setTurn(turn === 1 ? 2 : 1);
      return;
    }
    const ai = drop(next, aiMove(next), 2);
    if (ai) {
      setBoard(ai);
      const aiEnd = winner(ai);
      if (aiEnd === 1) {
        setYou((n) => n + 1);
        writeScore("connect4", 1);
      } else if (aiEnd === 2) setThem((n) => n + 1);
      setTurn(1);
    }
  }

  function reset() {
    setBoard(empty());
    setTurn(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Seg
          lang={lang}
          value={mode}
          onChange={(m) => {
            setMode(m);
            reset();
          }}
          options={[
            { id: "ai", ar: "ضد واحة", en: "Vs Waha" },
            { id: "hot", ar: "شخصان", en: "Two players" },
          ]}
        />
        <Button size="sm" variant="outline" onClick={reset}>
          {t(lang, "newGame")}
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label={L("أنت", "You")} value={you} />
        <Stat label={L("خصم", "Them")} value={them} />
        <Stat label={L("الدور", "Turn")} value={w ? "—" : turn === 1 ? L("أنت", "You") : L("خصم", "Them")} />
      </div>
      <div className="relative mx-auto max-w-md">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: COLS }, (_, c) => (
            <button
              key={`drop-${c}`}
              type="button"
              onClick={() => play(c)}
              className="h-8 rounded-md text-xs text-muted hover:bg-surface-2"
              aria-label={`${L("عمود", "Column")} ${c + 1}`}
            >
              ↓
            </button>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1 rounded-xl border border-border bg-surface p-2">
          {board.map((cell, i) => (
            <button
              key={i}
              type="button"
              onClick={() => play(i % COLS)}
              className="aspect-square rounded-full border border-border"
              style={{
                background:
                  cell === 1
                    ? "var(--color-primary)"
                    : cell === 2
                      ? "var(--color-fg)"
                      : "var(--color-bg)",
              }}
            />
          ))}
        </div>
        {w ? (
          <RoundOverlay
            title={w === "draw" ? L("تعادل", "Draw") : w === 1 ? t(lang, "youWin") : L("فاز الخصم", "Opponent wins")}
            detail={L("جولة أخرى متى شئت.", "Another round whenever you like.")}
            actionLabel={t(lang, "restart")}
            onAction={reset}
          />
        ) : null}
      </div>
    </div>
  );
}
