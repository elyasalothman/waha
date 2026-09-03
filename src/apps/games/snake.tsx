import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { readScore, writeScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

const COLS = 20;
const ROWS = 20;
const BASE_STEP = 0.14;
const MIN_STEP = 0.055;

type Point = { x: number; y: number };
type Status = "idle" | "play" | "over" | "win";

function token(name: string): string {
  if (typeof window === "undefined") return "rgb(0,0,0)";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "rgb(0,0,0)";
}

function eq(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

function spawnFood(snake: Point[]): Point {
  const taken = new Set(snake.map((p) => `${p.x},${p.y}`));
  const free: Point[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!taken.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { x: 0, y: 0 };
  return free[Math.floor(Math.random() * free.length)]!;
}

function opposite(a: Point, b: Point) {
  return a.x + b.x === 0 && a.y + b.y === 0 && (a.x !== 0 || a.y !== 0);
}

export function SnakeApp() {
  const lang = useAppStore((s) => s.lang);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const pausedRef = useRef(false);
  const statusRef = useRef<Status>("idle");
  const dirRef = useRef<Point>({ x: 1, y: 0 });
  const pendingRef = useRef<Point>({ x: 1, y: 0 });
  const snakeRef = useRef<Point[]>([
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ]);
  const foodRef = useRef<Point>({ x: 14, y: 10 });
  const scoreRef = useRef(0);
  const accRef = useRef(0);
  const lastRef = useRef(0);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setBest(readScore("snake"));
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const reset = useCallback(() => {
    snakeRef.current = [
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 },
    ];
    foodRef.current = { x: 14, y: 10 };
    dirRef.current = { x: 1, y: 0 };
    pendingRef.current = { x: 1, y: 0 };
    scoreRef.current = 0;
    accRef.current = 0;
    setScore(0);
    setPaused(false);
  }, []);

  const turn = useCallback((next: Point) => {
    if (statusRef.current !== "play" || pausedRef.current) return;
    if (opposite(pendingRef.current, next)) return;
    pendingRef.current = next;
  }, []);

  const finish = useCallback((kind: "over" | "win") => {
    statusRef.current = kind;
    setStatus(kind);
    const next = writeScore("snake", scoreRef.current);
    setBest(next);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Point> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        KeyW: { x: 0, y: -1 },
        KeyS: { x: 0, y: 1 },
        KeyA: { x: -1, y: 0 },
        KeyD: { x: 1, y: 0 },
      };
      const d = map[e.code];
      if (d) {
        e.preventDefault();
        turn(d);
      }
      if (e.code === "Space" && statusRef.current === "play") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [turn]);

  useEffect(() => {
    if (status !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    lastRef.current = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastRef.current) / 1000);
      lastRef.current = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const cssW = Math.max(1, rect.width);
      const cssH = Math.max(1, rect.height);
      const pw = Math.floor(cssW * dpr);
      const ph = Math.floor(cssH * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        raf = requestAnimationFrame(loop);
        return;
      }

      if (!pausedRef.current && statusRef.current === "play") {
        accRef.current += dt;
        const step = Math.max(MIN_STEP, BASE_STEP - scoreRef.current * 0.003);
        while (accRef.current >= step && statusRef.current === "play") {
          accRef.current -= step;
          dirRef.current = pendingRef.current;
          const snake = snakeRef.current;
          const head = snake[0]!;
          const next = { x: head.x + dirRef.current.x, y: head.y + dirRef.current.y };
          if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS) {
            finish("over");
            break;
          }
          const eating = eq(next, foodRef.current);
          const body = eating ? snake : snake.slice(0, -1);
          if (body.some((p) => eq(p, next))) {
            finish("over");
            break;
          }
          snakeRef.current = [next, ...body];
          if (eating) {
            scoreRef.current += 10;
            setScore(scoreRef.current);
            if (snakeRef.current.length >= COLS * ROWS) {
              finish("win");
              break;
            }
            foodRef.current = spawnFood(snakeRef.current);
          }
        }
      }

      const bg = token("--color-bg");
      const surface = token("--color-surface");
      const border = token("--color-border");
      const fg = token("--color-fg");
      const primary = token("--color-primary");
      const danger = token("--color-danger");

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = surface;
      ctx.fillRect(0, 0, cssW, cssH);
      const cell = Math.min(cssW / COLS, cssH / ROWS);
      const ox = (cssW - cell * COLS) / 2;
      const oy = (cssH - cell * ROWS) / 2;
      ctx.fillStyle = bg;
      ctx.fillRect(ox, oy, cell * COLS, cell * ROWS);

      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.35;
      for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(ox + i * cell, oy);
        ctx.lineTo(ox + i * cell, oy + ROWS * cell);
        ctx.stroke();
      }
      for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(ox, oy + i * cell);
        ctx.lineTo(ox + COLS * cell, oy + i * cell);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      const pad = Math.max(1, cell * 0.08);
      const snake = snakeRef.current;
      snake.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? primary : fg;
        ctx.globalAlpha = i === 0 ? 1 : Math.max(0.45, 1 - i * 0.03);
        ctx.fillRect(ox + p.x * cell + pad, oy + p.y * cell + pad, cell - pad * 2, cell - pad * 2);
      });
      ctx.globalAlpha = 1;
      const f = foodRef.current;
      ctx.fillStyle = danger;
      const fr = (cell - pad * 2) / 2;
      ctx.beginPath();
      ctx.arc(ox + f.x * cell + cell / 2, oy + f.y * cell + cell / 2, fr * 0.78, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status, finish]);

  const onPointerDown = (e: PointerEvent) => {
    swipeRef.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.hypot(dx, dy) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) turn({ x: dx > 0 ? 1 : -1, y: 0 });
    else turn({ x: 0, y: dy > 0 ? 1 : -1 });
  };

  const start = () => {
    reset();
    statusRef.current = "play";
    setStatus("play");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label={t(lang, "score")} value={score} />
        <Stat label={t(lang, "best")} value={best} />
        <Stat label={t(lang, "level")} value={1 + Math.floor(score / 50)} />
      </div>
      <Card className="relative overflow-hidden p-2">
        <div
          ref={wrapRef}
          className="relative mx-auto aspect-square w-full max-w-md touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            swipeRef.current = null;
          }}
        >
          <canvas ref={canvasRef} className="size-full touch-none" />
          {status !== "play" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg/80 p-4 text-center">
              <p className="text-lg font-medium text-fg">
                {status === "idle" ? (lang === "ar" ? "الثعبان" : "Snake") : status === "win" ? t(lang, "youWin") : t(lang, "gameOver")}
              </p>
              <Button onClick={start}>{status === "idle" ? t(lang, "start") : t(lang, "restart")}</Button>
            </div>
          )}
          {status === "play" && paused && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg/80">
              <p className="text-lg font-medium">{t(lang, "pause")}</p>
              <Button onClick={() => setPaused(false)}>{t(lang, "resume")}</Button>
            </div>
          )}
        </div>
      </Card>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {status === "play" && (
          <Button variant="secondary" onClick={() => setPaused((p) => !p)}>
            {paused ? t(lang, "resume") : t(lang, "pause")}
          </Button>
        )}
        {status !== "idle" && (
          <Button variant="outline" onClick={start}>
            {t(lang, "newGame")}
          </Button>
        )}
      </div>
      <div className="mx-auto grid w-full max-w-xs grid-cols-3 gap-2">
        <div />
        <Button variant="secondary" size="icon" aria-label={lang === "ar" ? "أعلى" : "Up"} onClick={() => turn({ x: 0, y: -1 })}>
          <span className="text-lg">↑</span>
        </Button>
        <div />
        <Button variant="secondary" size="icon" aria-label={lang === "ar" ? "يسار" : "Left"} onClick={() => turn({ x: -1, y: 0 })}>
          <span className="text-lg">←</span>
        </Button>
        <Button variant="secondary" size="icon" aria-label={lang === "ar" ? "أسفل" : "Down"} onClick={() => turn({ x: 0, y: 1 })}>
          <span className="text-lg">↓</span>
        </Button>
        <Button variant="secondary" size="icon" aria-label={lang === "ar" ? "يمين" : "Right"} onClick={() => turn({ x: 1, y: 0 })}>
          <span className="text-lg">→</span>
        </Button>
      </div>
    </div>
  );
}
