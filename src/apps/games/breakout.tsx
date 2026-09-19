import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { RoundOverlay } from "@/components/round-overlay";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { readScore, writeScore } from "@/lib/storage";
import { themeColor } from "@/lib/palette";
import { useAppStore } from "@/store/app-store";

const W = 480;
const H = 320;

type Brick = { x: number; y: number; w: number; h: number; live: boolean };
type Status = "idle" | "ready" | "play" | "over" | "win";

function makeBricks(): Brick[] {
  const out: Brick[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 8; c++) {
      out.push({ x: 16 + c * 56, y: 24 + r * 18, w: 50, h: 14, live: true });
    }
  }
  return out;
}

function css(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function BreakoutApp() {
  const lang = useAppStore((s) => s.lang);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [best, setBest] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const keys = useRef({ l: false, r: false });
  const paddle = useRef({ x: 200, w: 80 });
  const ball = useRef({ x: 240, y: H - 28, vx: 160, vy: -180 });
  const bricks = useRef<Brick[]>(makeBricks());
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const statusRef = useRef(status);
  const last = useRef(0);
  const dragX = useRef<number | null>(null);

  useEffect(() => setBest(readScore("breakout")), []);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const parkBall = useCallback(() => {
    ball.current = { x: paddle.current.x + paddle.current.w / 2, y: H - 28, vx: 160, vy: -180 };
  }, []);

  const reset = useCallback(() => {
    paddle.current = { x: 200, w: 80 };
    bricks.current = makeBricks();
    scoreRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
    parkBall();
  }, [parkBall]);

  const serve = useCallback(() => {
    if (statusRef.current !== "ready") return;
    ball.current = { x: paddle.current.x + paddle.current.w / 2, y: H - 28, vx: 160, vy: -180 };
    statusRef.current = "play";
    setStatus("play");
  }, []);

  const begin = useCallback(() => {
    reset();
    statusRef.current = "ready";
    setStatus("ready");
  }, [reset]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.current.l = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.current.r = true;
      if (e.code === "Space") {
        e.preventDefault();
        if (statusRef.current === "idle" || statusRef.current === "over" || statusRef.current === "win") begin();
        else serve();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.current.l = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.current.r = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [begin, serve]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    last.current = 0;
    const loop = (t: number) => {
      const dt = Math.min(0.1, last.current ? (t - last.current) / 1000 : 0);
      last.current = t;
      const fg = themeColor("fg", css("--color-fg"));
      const primary = themeColor("primary", css("--color-primary"));
      const surface = themeColor("surface-2", css("--color-surface-2"));
      ctx.fillStyle = surface;
      ctx.fillRect(0, 0, W, H);

      const p = paddle.current;
      const speed = 340;
      if (statusRef.current === "play" || statusRef.current === "ready") {
        if (keys.current.l) p.x -= speed * dt;
        if (keys.current.r) p.x += speed * dt;
        if (dragX.current != null) p.x = dragX.current - p.w / 2;
        p.x = Math.max(0, Math.min(W - p.w, p.x));
      }

      if (statusRef.current === "ready") {
        parkBall();
      }

      if (statusRef.current === "play") {
        const b = ball.current;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < 6 || b.x > W - 6) b.vx *= -1;
        if (b.y < 6) b.vy *= -1;
        if (b.y > H - 18 && b.x > p.x && b.x < p.x + p.w && b.vy > 0) {
          b.vy *= -1;
          b.vx += (b.x - (p.x + p.w / 2)) * 4;
        }
        for (const br of bricks.current) {
          if (!br.live) continue;
          if (b.x > br.x && b.x < br.x + br.w && b.y > br.y && b.y < br.y + br.h) {
            br.live = false;
            b.vy *= -1;
            scoreRef.current += 10;
            setScore(scoreRef.current);
          }
        }
        if (b.y > H) {
          livesRef.current -= 1;
          setLives(livesRef.current);
          if (livesRef.current <= 0) {
            statusRef.current = "over";
            setStatus("over");
            setBest(writeScore("breakout", scoreRef.current));
          } else {
            statusRef.current = "ready";
            setStatus("ready");
            parkBall();
          }
        }
        if (bricks.current.every((br) => !br.live)) {
          statusRef.current = "win";
          setStatus("win");
          setBest(writeScore("breakout", scoreRef.current));
        }
      }

      ctx.fillStyle = primary;
      ctx.fillRect(paddle.current.x, H - 14, paddle.current.w, 8);
      ctx.beginPath();
      ctx.arc(ball.current.x, ball.current.y, 6, 0, Math.PI * 2);
      ctx.fill();
      for (const br of bricks.current) {
        if (!br.live) continue;
        ctx.fillStyle = fg;
        ctx.fillRect(br.x, br.y, br.w, br.h);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [parkBall]);

  function pos(e: PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    dragX.current = ((e.clientX - rect.left) / rect.width) * W;
  }

  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const title =
    status === "win" ? t(lang, "youWin") : status === "over" ? t(lang, "gameOver") : L("محطّم الطوب", "Breakout");

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label={t(lang, "score")} value={score} />
        <Stat label={t(lang, "lives")} value={lives} />
        <Stat label={t(lang, "best")} value={best} />
      </div>
      <div className="relative overflow-hidden rounded-lg border border-border">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full touch-none"
          onPointerDown={(e) => {
            pos(e);
            if (status === "idle" || status === "over" || status === "win") begin();
            else if (status === "ready") serve();
          }}
          onPointerMove={(e) => e.buttons && pos(e)}
          onPointerUp={() => {
            dragX.current = null;
          }}
        />
        {status === "idle" || status === "over" || status === "win" ? (
          <RoundOverlay
            title={title}
            detail={
              status === "idle"
                ? L("حرّك المضرب، ثم اضغط لتبدأ الكرة.", "Move the paddle, then tap to serve.")
                : L(`النقاط ${score} — الأفضل ${best}`, `Score ${score} — best ${best}`)
            }
            actionLabel={status === "idle" ? t(lang, "start") : t(lang, "restart")}
            onAction={begin}
          />
        ) : null}
        {status === "ready" ? (
          <p className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-sm text-muted">
            {L("اضغط أو مسافة — انطلق", "Tap or Space to serve")}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {status === "ready" ? (
          <Button onClick={serve}>{L("انطلق", "Serve")}</Button>
        ) : null}
        {status !== "idle" ? (
          <Button variant="outline" onClick={begin}>
            {t(lang, "newGame")}
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-subtle">{L("أسهم أو اسحب المضرب — مسافة للانطلاق", "Arrows or drag the paddle — Space to serve")}</p>
    </div>
  );
}
