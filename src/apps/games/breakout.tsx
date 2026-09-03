import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { readScore, writeScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

const W = 480;
const H = 320;

type Brick = { x: number; y: number; w: number; h: number; live: boolean };

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
  const [status, setStatus] = useState<"idle" | "play" | "over" | "win">("idle");
  const keys = useRef({ l: false, r: false });
  const paddle = useRef({ x: 200, w: 80 });
  const ball = useRef({ x: 240, y: 200, vx: 160, vy: -180 });
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

  const reset = useCallback(() => {
    paddle.current = { x: 200, w: 80 };
    ball.current = { x: 240, y: 200, vx: 160, vy: -180 };
    bricks.current = makeBricks();
    scoreRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.current.l = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.current.r = true;
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
  }, []);

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
      const fg = css("--color-fg") || "#eceee9";
      const primary = css("--color-primary") || "#c5d0c4";
      const surface = css("--color-surface-2") || "#1c1f1d";
      const muted = css("--color-muted") || "#8d938c";
      ctx.fillStyle = surface;
      ctx.fillRect(0, 0, W, H);

      if (statusRef.current === "play") {
        const p = paddle.current;
        const speed = 340;
        if (keys.current.l) p.x -= speed * dt;
        if (keys.current.r) p.x += speed * dt;
        if (dragX.current != null) p.x = dragX.current - p.w / 2;
        p.x = Math.max(0, Math.min(W - p.w, p.x));
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
          b.x = 240;
          b.y = 200;
          b.vx = 160;
          b.vy = -180;
          if (livesRef.current <= 0) {
            statusRef.current = "over";
            setStatus("over");
            setBest(writeScore("breakout", scoreRef.current));
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
      ctx.fillStyle = muted;
      ctx.font = "12px monospace";
      if (statusRef.current !== "play") {
        ctx.fillText(statusRef.current === "win" ? "OK" : statusRef.current === "over" ? "—" : "▶", 12, H - 24);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  function pos(e: PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    dragX.current = ((e.clientX - rect.left) / rect.width) * W;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Stat label={t(lang, "score")} value={score} />
        <Stat label={t(lang, "lives")} value={lives} />
        <Stat label={t(lang, "best")} value={best} />
        <Button
          size="sm"
          onClick={() => {
            reset();
            setStatus("play");
            statusRef.current = "play";
          }}
        >
          {status === "play" ? t(lang, "restart") : t(lang, "start")}
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full touch-none rounded-lg border border-border"
        onPointerDown={pos}
        onPointerMove={(e) => e.buttons && pos(e)}
        onPointerUp={() => {
          dragX.current = null;
        }}
      />
      <p className="text-xs text-subtle">{lang === "ar" ? "أسهم أو اسحب المضرب" : "Arrows or drag the paddle"}</p>
    </div>
  );
}
