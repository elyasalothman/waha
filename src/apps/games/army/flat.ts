/**
 * جيش الواحة without WebGL. Same simulation, drawn on a 2D canvas.
 */
import {
  LANE,
  autopilot,
  createGame,
  fireBand,
  progress,
  step,
  steer,
  type GameState,
  type Upgrades,
} from "@/lib/army/engine";
import { opLabel, type LevelSpec } from "@/lib/army/levels";
import type { ArmyAudio } from "./audio";

type Opts = {
  onEnd: (info: { state: GameState; won: boolean }) => void;
  onContextLost?: () => void;
  onProgress?: (p: number) => void;
};

export class FlatArmy {
  demo = true;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState | null = null;
  private paused = false;
  private disposed = false;
  private raf = 0;
  private last = 0;
  private dragging = false;
  private dragStartX = 0;
  private dragStartTarget = 0;
  private ended = false;

  constructor(
    private host: HTMLElement,
    _labels: HTMLElement,
    private audio: ArmyAudio,
    private opts: Opts,
  ) {
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    host.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d unavailable");
    this.canvas = canvas;
    this.ctx = ctx;
    this.onDown = this.onDown.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onUp = this.onUp.bind(this);
    host.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointermove", this.onMove);
    window.addEventListener("pointerup", this.onUp);
    this.resize();
    this.raf = requestAnimationFrame(this.frame);
  }

  load(level: LevelSpec, upgrades: Upgrades, opts: { demo?: boolean; carry?: { n: number; stacks: number } } = {}) {
    this.demo = !!opts.demo;
    this.paused = false;
    this.ended = false;
    this.state = createGame(level, upgrades, opts.carry);
    this.opts.onProgress?.(0);
  }

  /** Jump a careful run to mid-track or the boss, for a still picture. */
  seek(mode: "run" | "boss") {
    const s = this.state;
    if (!s) return;
    this.demo = false;
    this.paused = true;
    let guard = 0;
    while (s.phase === "run" && guard++ < 60 * 120) {
      if (mode === "run" && s.army.dist > s.level.length * 0.45) break;
      steer(s, autopilot(s, 1));
      step(s, 1 / 60);
      s.events.length = 0;
    }
    this.draw(s);
  }

  setPaused(p: boolean) {
    this.paused = p;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.host.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerup", this.onUp);
    this.canvas.remove();
  }

  private resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(320, this.host.clientWidth);
    const h = Math.max(480, this.host.clientHeight);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private frame = (now: number) => {
    if (this.disposed) return;
    const dt = Math.min(0.05, this.last ? (now - this.last) / 1000 : 1 / 60);
    this.last = now;
    const s = this.state;
    if (s && !this.paused && !this.ended) {
      if (this.demo) steer(s, autopilot(s, 1));
      step(s, dt);
      this.opts.onProgress?.(progress(s));
      if ((s.phase === "won" || s.phase === "lost") && !this.demo && !this.ended) {
        this.ended = true;
        this.opts.onEnd({ state: s, won: s.phase === "won" });
      }
      s.events.length = 0;
    }
    if (s) this.draw(s);
    this.raf = requestAnimationFrame(this.frame);
  };

  private onDown(e: PointerEvent) {
    if (!this.state || this.demo || this.paused) return;
    this.dragging = true;
    this.dragStartX = e.clientX;
    this.dragStartTarget = this.state.army.targetX;
    this.audio.unlock();
  }

  private onMove(e: PointerEvent) {
    if (!this.dragging || !this.state) return;
    const w = Math.max(320, this.host.clientWidth);
    steer(this.state, this.dragStartTarget + ((e.clientX - this.dragStartX) / w) * LANE * 2.6);
  }

  private onUp() {
    this.dragging = false;
  }

  private draw(s: GameState) {
    this.resize();
    const ctx = this.ctx;
    const w = this.host.clientWidth;
    const height = this.host.clientHeight;
    ctx.clearRect(0, 0, w, height);
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#f4e2c4");
    sky.addColorStop(1, "#e7c48a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, height);
    const roadL = w * 0.18;
    const roadR = w * 0.82;
    ctx.fillStyle = "#f7e7c6";
    ctx.fillRect(roadL, 0, roadR - roadL, height);
    ctx.strokeStyle = "#c4a36a";
    ctx.lineWidth = 4;
    ctx.strokeRect(roadL, 0, roadR - roadL, height);
    const cam = s.army.dist + 8;
    const yOf = (dist: number) => height * 0.72 - (dist - cam) * 7;
    const xOf = (x: number) => (w / 2) + (x / LANE) * ((roadR - roadL) / 2);

    const band = (side: -1 | 0 | 1, dist: number, fill: string, label: string) => {
      const [lo, hi] = fireBand(side);
      const y = yOf(dist);
      ctx.fillStyle = fill;
      ctx.fillRect(xOf(lo), y - 18, xOf(hi) - xOf(lo), 36);
      ctx.fillStyle = "#1c140c";
      ctx.font = "700 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, (xOf(lo) + xOf(hi)) / 2, y + 5);
    };
    for (const h of s.hazards) {
      if (h.done) continue;
      const y = yOf(h.at);
      if (y < -40 || y > height + 40) continue;
      if (h.kind === "blade") band(h.side, h.at, "rgba(180, 40, 40, 0.85)", "شفرة");
      else if (h.kind === "wall") band(h.side, h.at, "rgba(90, 70, 50, 0.9)", "جدار");
      else band(h.side, h.at, "rgba(40, 24, 12, 0.88)", "حفرة");
    }
    for (const g of s.gates) {
      if (g.used) continue;
      const y = yOf(g.at);
      if (y < -30 || y > height + 30) continue;
      const paint = (side: -1 | 1, text: string) => {
        const x = xOf(side * 2.4);
        ctx.fillStyle = text.startsWith("−") || text.startsWith("÷") ? "#9a3412" : "#146455";
        ctx.fillRect(x - 36, y - 22, 72, 44);
        ctx.fillStyle = "#fff";
        ctx.font = "800 20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(text, x, y + 7);
      };
      if (g.left) paint(-1, opLabel(g.left));
      if (g.right) paint(1, opLabel(g.right));
    }
    for (const e of s.enemies) {
      if (e.dead) continue;
      const y = yOf(e.at);
      if (y < -20 || y > height + 20) continue;
      ctx.fillStyle = "#9f1239";
      ctx.beginPath();
      ctx.arc(xOf(e.x), y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "700 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(e.count), xOf(e.x), y + 4);
    }
    if (s.phase === "boss" || s.army.dist > s.level.length - 30) {
      const y = yOf(s.boss.at);
      ctx.fillStyle = "#3f2a1d";
      ctx.fillRect(roadL + 16, y - 36, roadR - roadL - 32, 64);
      ctx.fillStyle = "#f8e7c8";
      ctx.font = "800 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(s.level.boss.kind === "fort" ? "القلعة" : "الزعيم", w / 2, y - 4);
      ctx.font = "700 13px sans-serif";
      ctx.fillText(String(Math.max(0, Math.round(s.boss.hp))), w / 2, y + 16);
    }
    const ax = xOf(s.army.x);
    const ay = yOf(s.army.dist);
    const dots = Math.min(24, s.army.n);
    for (let i = 0; i < dots; i++) {
      const ang = i * 2.4;
      const rad = 6 + (i % 5) * 4;
      ctx.fillStyle = "#146455";
      ctx.beginPath();
      ctx.arc(ax + Math.cos(ang) * rad, ay + Math.sin(ang) * rad * 0.6, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#10251e";
    ctx.font = "800 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(s.army.n), ax, ay - 28);
  }
}
