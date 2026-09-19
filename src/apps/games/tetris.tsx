import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { readScore, writeScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

const COLS = 10;
const ROWS = 20;
const KINDS = ["I", "O", "T", "S", "Z", "J", "L"] as const;
type Kind = (typeof KINDS)[number];
type Cell = Kind | 0;
type Rot = 0 | 1 | 2 | 3;

const SHAPES: Record<Kind, [number, number][][]> = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  O: [
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]],
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],
};

const JLSTZ: Record<string, [number, number][]> = {
  "0>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "1>0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "1>2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "2>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "2>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "3>2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "3>0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "0>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const I_KICKS: Record<string, [number, number][]> = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

type Piece = { k: Kind; r: Rot; x: number; y: number };

function cells(p: Piece): [number, number][] {
  return SHAPES[p.k][p.r]!.map(([x, y]) => [p.x + x, p.y + y]);
}

function fits(board: Cell[], p: Piece) {
  return cells(p).every(([x, y]) => x >= 0 && x < COLS && y < ROWS && (y < 0 || board[y * COLS + x] === 0));
}

function shuffleBag(): Kind[] {
  const a = [...KINDS];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function spawn(k: Kind): Piece {
  return { k, r: 0, x: 3, y: -1 };
}

function css(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const LINE_SCORE = [0, 100, 300, 500, 800];

export function TetrisApp() {
  const lang = useAppStore((s) => s.lang);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [status, setStatus] = useState<"idle" | "play" | "over">("idle");
  const [, bump] = useState(0);
  const board = useRef<Cell[]>(Array(COLS * ROWS).fill(0));
  const piece = useRef<Piece | null>(null);
  const bag = useRef<Kind[]>([]);
  const nextQ = useRef<Kind[]>([]);
  const hold = useRef<Kind | null>(null);
  const held = useRef(false);
  const fallAcc = useRef(0);
  const lockAcc = useRef(0);
  const lockResets = useRef(0);
  const last = useRef(0);
  const keys = useRef({ l: false, r: false, d: false });
  const das = useRef({ dir: 0, t: 0 });
  const statusRef = useRef(status);
  const scoreRef = useRef(0);
  const linesRef = useRef(0);

  useEffect(() => setBest(readScore("tetris")), []);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const deal = useCallback(() => {
    if (bag.current.length === 0) bag.current = shuffleBag();
    return bag.current.shift()!;
  }, []);

  const fillNext = useCallback(() => {
    while (nextQ.current.length < 3) nextQ.current.push(deal());
  }, [deal]);

  const spawnNext = useCallback(() => {
    fillNext();
    const k = nextQ.current.shift()!;
    fillNext();
    const p = spawn(k);
    piece.current = p;
    held.current = false;
    lockAcc.current = 0;
    lockResets.current = 0;
    bump((n) => n + 1);
    if (!fits(board.current, p)) {
      setStatus("over");
      writeScore("tetris", scoreRef.current);
      setBest((b) => Math.max(b, scoreRef.current));
    }
  }, [fillNext]);

  const reset = useCallback(() => {
    board.current = Array(COLS * ROWS).fill(0);
    bag.current = shuffleBag();
    nextQ.current = [];
    hold.current = null;
    scoreRef.current = 0;
    linesRef.current = 0;
    setScore(0);
    setLines(0);
    setLevel(1);
    spawnNext();
  }, [spawnNext]);

  const tryMove = useCallback((dx: number, dy: number) => {
    const p = piece.current;
    if (!p) return false;
    const n = { ...p, x: p.x + dx, y: p.y + dy };
    if (!fits(board.current, n)) return false;
    piece.current = n;
    if (dx !== 0 || dy < 0) {
      if (lockResets.current < 15) {
        lockAcc.current = 0;
        lockResets.current += 1;
      }
    }
    return true;
  }, []);

  const rotate = useCallback((dir: 1 | -1) => {
    const p = piece.current;
    if (!p) return;
    const to = ((p.r + dir + 4) % 4) as Rot;
    const key = `${p.r}>${to}`;
    const kicks = p.k === "O" ? [[0, 0] as [number, number]] : p.k === "I" ? I_KICKS[key] ?? [[0, 0]] : JLSTZ[key] ?? [[0, 0]];
    for (const [kx, ky] of kicks) {
      const n: Piece = { ...p, r: to, x: p.x + kx, y: p.y - ky };
      if (fits(board.current, n)) {
        piece.current = n;
        if (lockResets.current < 15) {
          lockAcc.current = 0;
          lockResets.current += 1;
        }
        return;
      }
    }
  }, []);

  const lock = useCallback(() => {
    const p = piece.current;
    if (!p) return;
    for (const [x, y] of cells(p)) {
      if (y >= 0) board.current[y * COLS + x] = p.k;
    }
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      const row = board.current.slice(r * COLS, r * COLS + COLS);
      if (row.every((c) => c !== 0)) {
        board.current.splice(r * COLS, COLS);
        board.current.unshift(...Array(COLS).fill(0));
        cleared += 1;
        r += 1;
      }
    }
    const lv = Math.floor(linesRef.current / 10) + 1;
    const add = (LINE_SCORE[cleared] ?? 0) * lv;
    scoreRef.current += add;
    linesRef.current += cleared;
    setScore(scoreRef.current);
    setLines(linesRef.current);
    setLevel(Math.floor(linesRef.current / 10) + 1);
    spawnNext();
  }, [spawnNext]);

  const hardDrop = useCallback(() => {
    const p = piece.current;
    if (!p) return;
    let dist = 0;
    while (tryMove(0, 1)) dist += 1;
    scoreRef.current += dist * 2;
    setScore(scoreRef.current);
    lock();
  }, [lock, tryMove]);

  const doHold = useCallback(() => {
    const p = piece.current;
    if (!p || held.current) return;
    held.current = true;
    const prev = hold.current;
    hold.current = p.k;
    if (prev) piece.current = spawn(prev);
    else spawnNext();
    bump((n) => n + 1);
    if (piece.current && !fits(board.current, piece.current)) {
      piece.current = p;
      hold.current = prev;
    }
  }, [spawnNext]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (statusRef.current !== "play") return;
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " ", "c", "C", "z", "Z", "x", "X"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowLeft") keys.current.l = true;
      if (e.key === "ArrowRight") keys.current.r = true;
      if (e.key === "ArrowDown") keys.current.d = true;
      if (e.key === "ArrowUp" || e.key === "x" || e.key === "X") rotate(1);
      if (e.key === "z" || e.key === "Z") rotate(-1);
      if (e.key === " ") hardDrop();
      if (e.key === "c" || e.key === "C") doHold();
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") keys.current.l = false;
      if (e.key === "ArrowRight") keys.current.r = false;
      if (e.key === "ArrowDown") keys.current.d = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [doHold, hardDrop, rotate]);

  useEffect(() => {
    if (status !== "play") return;
    let raf = 0;
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - (last.current || t)) / 1000);
      last.current = t;
      const lv = Math.floor(linesRef.current / 10) + 1;
      const grav = Math.max(0.08, 1 - (lv - 1) * 0.08);
      const dir = keys.current.l && !keys.current.r ? -1 : keys.current.r && !keys.current.l ? 1 : 0;
      if (dir !== das.current.dir) {
        das.current = { dir, t: 0 };
        if (dir) tryMove(dir, 0);
      } else if (dir) {
        das.current.t += dt;
        if (das.current.t > 0.16) {
          das.current.t -= 0.05;
          tryMove(dir, 0);
        }
      }
      fallAcc.current += dt;
      const interval = keys.current.d ? 0.05 : grav;
      while (fallAcc.current >= interval) {
        fallAcc.current -= interval;
        if (!tryMove(0, 1)) {
          lockAcc.current += interval;
          if (lockAcc.current >= 0.5) lock();
        } else if (keys.current.d) {
          scoreRef.current += 1;
          setScore(scoreRef.current);
          lockAcc.current = 0;
        } else {
          lockAcc.current = 0;
        }
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    last.current = 0;
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status, lock, tryMove]);

  function ghostY(p: Piece) {
    let g = { ...p };
    while (fits(board.current, { ...g, y: g.y + 1 })) g.y += 1;
    return g;
  }

  function colorOf(k: Kind) {
    const map: Record<Kind, string> = {
      I: css("--color-primary") || "#c5d0c4",
      O: css("--color-fg") || "#eceee9",
      T: css("--color-success") || "#6f9b7a",
      S: css("--color-muted") || "#8d938c",
      Z: css("--color-warn") || "#b8956a",
      J: css("--color-subtle") || "#6a7069",
      L: css("--color-primary") || "#c5d0c4",
    };
    return map[k];
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = 240;
    const h = 480;
    if (canvas.width !== w * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = css("--color-bg") || "#0c0d0c";
    const border = css("--color-border") || "#2a2e2b";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const cw = w / COLS;
    const ch = h / ROWS;
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = board.current[r * COLS + c];
        if (cell) {
          ctx.fillStyle = colorOf(cell);
          ctx.fillRect(c * cw + 1, r * ch + 1, cw - 2, ch - 2);
        }
      }
    }
    const p = piece.current;
    if (p) {
      const g = ghostY(p);
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = colorOf(p.k);
      for (const [x, y] of cells(g)) {
        if (y >= 0) ctx.fillRect(x * cw + 1, y * ch + 1, cw - 2, ch - 2);
      }
      ctx.globalAlpha = 1;
      for (const [x, y] of cells(p)) {
        if (y >= 0) ctx.fillRect(x * cw + 1, y * ch + 1, cw - 2, ch - 2);
      }
    }
  }

  function start() {
    reset();
    setStatus("play");
  }

  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label={t(lang, "score")} value={score} />
        <Stat label={t(lang, "best")} value={best} />
        <Stat label={t(lang, "level")} value={level} />
      </div>
      <div className="flex flex-wrap items-start justify-center gap-4">
        <div className="space-y-2 text-xs text-muted">
          <p>{L("الاحتفاظ", "Hold")}</p>
          <p className="font-mono text-lg text-fg">{hold.current ?? "—"}</p>
          <p className="mt-4">{L("التالي", "Next")}</p>
          <p className="font-mono text-lg text-fg">{nextQ.current.join("  ") || "—"}</p>
        </div>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="h-[min(70vh,480px)] w-auto max-w-full rounded-xl border border-border bg-bg touch-none"
            style={{ aspectRatio: "10 / 20" }}
          />
          {status !== "play" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-bg/80 p-4 text-center">
              <p className="mb-1 text-lg font-medium">{status === "over" ? t(lang, "gameOver") : L("تتريس", "Tetris")}</p>
              <p className="mb-3 text-sm text-muted">
                {status === "over"
                  ? `${t(lang, "score")} ${score} · ${t(lang, "best")} ${best}`
                  : L("صفّ سطراً ليمسح — لا تملأ العمود.", "Clear a line. Don’t stack out.")}
              </p>
              <Button onClick={start}>{status === "over" ? t(lang, "restart") : t(lang, "start")}</Button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:hidden">
        <Button variant="secondary" onPointerDown={() => tryMove(-1, 0)}>
          ←
        </Button>
        <Button variant="secondary" onPointerDown={() => rotate(1)}>
          ↻
        </Button>
        <Button variant="secondary" onPointerDown={() => tryMove(0, 1)}>
          ↓
        </Button>
        <Button variant="secondary" onPointerDown={hardDrop}>
          ↧
        </Button>
        <Button variant="secondary" onPointerDown={() => tryMove(1, 0)}>
          →
        </Button>
        <Button variant="secondary" onPointerDown={doHold}>
          {L("أمسك", "Hold")}
        </Button>
      </div>
      {status === "play" ? (
        <Button variant="outline" onClick={start}>
          {t(lang, "newGame")}
        </Button>
      ) : null}
      <p className="hidden text-xs text-subtle sm:block">
        {L("أسهم للحركة، أعلى/X دوران، مسافة إسقاط، C احتفاظ.", "Arrows move, Up/X rotate, Space drop, C hold.")}
      </p>
    </div>
  );
}
