/**
 * جيش الواحة — level data. Pure data + a seeded generator for endless stages.
 * Distances are metres along the bridge (army runs toward +dist).
 */

/** Hard cap on the army size (keeps numbers readable and endless sane). */
export const ARMY_CAP = 999;

export type OpKind = "add" | "sub" | "mul" | "div";
export type GateOp = { kind: OpKind; v: number };
export type Side = -1 | 0 | 1;

export type EntitySpec =
  | { type: "gates"; at: number; left: GateOp; right: GateOp }
  | { type: "gate"; at: number; side: -1 | 1; op: GateOp }
  | { type: "grow"; at: number; side: -1 | 1; start: number; hp: number; max: number }
  | { type: "enemy"; at: number; count: number; x: number }
  | { type: "bow"; at: number; side: Side }
  | { type: "fire"; at: number; side: Side; len: number };

export type BossSpec = { hp: number; slam: number; every: number; kind: "chief" | "fort" };

export type LevelSpec = {
  id: number;
  name: string;
  length: number;
  boss: BossSpec;
  entities: EntitySpec[];
};

export function op(s: string): GateOp {
  const m = /^([+\-−x×/÷])\s*(\d+)$/.exec(s.trim());
  if (!m) throw new Error(`bad op ${s}`);
  const v = Number(m[2]);
  const c = m[1];
  if (c === "+") return { kind: "add", v };
  if (c === "-" || c === "−") return { kind: "sub", v };
  if (c === "x" || c === "×") return { kind: "mul", v };
  return { kind: "div", v };
}

export function opLabel(o: GateOp): string {
  if (o.kind === "add") return `+${o.v}`;
  if (o.kind === "sub") return `−${o.v}`;
  if (o.kind === "mul") return `×${o.v}`;
  return `÷${o.v}`;
}

export function applyOp(n: number, o: GateOp): number {
  let r = n;
  if (o.kind === "add") r = n + o.v;
  else if (o.kind === "sub") r = n - o.v;
  else if (o.kind === "mul") r = n * o.v;
  else r = Math.ceil(n / o.v);
  return Math.max(0, Math.min(ARMY_CAP, Math.round(r)));
}

export const isGood = (o: GateOp) => o.kind === "add" || o.kind === "mul";

const G = (at: number, l: string, r: string): EntitySpec => ({
  type: "gates",
  at,
  left: op(l),
  right: op(r),
});
const E = (at: number, count: number, x = 0): EntitySpec => ({ type: "enemy", at, count, x });
const B = (at: number, side: Side): EntitySpec => ({ type: "bow", at, side });
const F = (at: number, side: Side, len = 10): EntitySpec => ({ type: "fire", at, side, len });
const W = (at: number, side: -1 | 1, start: number, hp: number, max = 99): EntitySpec => ({
  type: "grow",
  at,
  side,
  start,
  hp,
  max,
});
const S = (at: number, side: -1 | 1, o: string): EntitySpec => ({
  type: "gate",
  at,
  side,
  op: op(o),
});

/** Ten handcrafted levels, rising difficulty. Left = −1 (screen left), right = +1. */
const RAW_LEVELS: LevelSpec[] = [
  {
    id: 1,
    name: "بوابة القافلة",
    length: 300,
    boss: { hp: 60, slam: 2, every: 3.2, kind: "chief" },
    entities: [
      G(45, "+5", "+2"),
      W(95, 1, 1, 3, 12),
      E(130, 8),
      G(175, "+3", "×2"),
      E(225, 14),
      G(265, "−4", "+8"),
    ],
  },
  {
    id: 2,
    name: "جسر النخيل",
    length: 360,
    boss: { hp: 140, slam: 3, every: 3, kind: "chief" },
    entities: [
      G(40, "×2", "+3"),
      B(85, -1),
      E(120, 16),
      G(160, "+10", "−5"),
      W(200, -1, 2, 4, 20),
      E(245, 24, 1.5),
      G(290, "÷2", "×2"),
      E(330, 20),
    ],
  },
  {
    id: 3,
    name: "عين الماء",
    length: 400,
    boss: { hp: 260, slam: 4, every: 2.9, kind: "chief" },
    entities: [
      G(40, "+6", "×2"),
      E(85, 18),
      G(125, "−10", "+12"),
      B(160, 1),
      F(195, -1, 10),
      E(235, 36),
      G(280, "×3", "+15"),
      W(320, 1, 3, 5, 30),
      E(360, 40),
    ],
  },
  {
    id: 4,
    name: "سوق السراب",
    length: 440,
    boss: { hp: 420, slam: 5, every: 2.8, kind: "fort" },
    entities: [
      G(40, "×2", "÷2"),
      G(80, "+8", "−6"),
      E(115, 26),
      F(150, 0, 10),
      G(185, "×2", "+20"),
      E(225, 50, -1.5),
      B(260, 0),
      G(295, "−20", "×2"),
      W(335, -1, 5, 6, 40),
      E(380, 70),
      G(415, "+15", "÷3"),
    ],
  },
  {
    id: 5,
    name: "كثبان العاصفة",
    length: 480,
    boss: { hp: 650, slam: 7, every: 2.7, kind: "chief" },
    entities: [
      G(40, "+10", "×2"),
      E(80, 30),
      F(115, 1, 12),
      G(150, "×3", "−15"),
      E(190, 60),
      B(220, -1),
      G(255, "÷2", "+25"),
      F(290, -1, 12),
      E(330, 90, 1),
      G(370, "×2", "−30"),
      W(405, 1, 4, 8, 45),
      E(445, 110),
    ],
  },
  {
    id: 6,
    name: "حصن الرمال",
    length: 520,
    boss: { hp: 950, slam: 9, every: 2.6, kind: "fort" },
    entities: [
      G(40, "×2", "+8"),
      G(80, "−10", "+15"),
      E(115, 40),
      F(150, 0, 12),
      B(185, 1),
      G(220, "×3", "÷2"),
      E(260, 90),
      G(300, "+30", "−25"),
      F(335, 1, 12),
      E(375, 130, -1),
      G(415, "÷3", "×2"),
      W(450, -1, 6, 8, 60),
      E(490, 150),
    ],
  },
  {
    id: 7,
    name: "ممر الجمر",
    length: 560,
    boss: { hp: 1350, slam: 12, every: 2.5, kind: "chief" },
    entities: [
      G(40, "+12", "×3"),
      F(75, -1, 12),
      E(110, 22),
      G(145, "×2", "−20"),
      F(180, 1, 12),
      B(210, 0),
      E(245, 110),
      G(285, "−40", "×3"),
      F(320, 0, 12),
      E(360, 160, 1),
      G(400, "+40", "÷2"),
      E(440, 140, -1.5),
      W(475, 1, 8, 9, 70),
      E(515, 200),
    ],
  },
  {
    id: 8,
    name: "قلعة الصخر",
    length: 600,
    boss: { hp: 1900, slam: 15, every: 2.4, kind: "fort" },
    entities: [
      G(40, "×2", "+10"),
      G(75, "+20", "−15"),
      E(110, 60),
      B(140, -1),
      F(170, 1, 14),
      G(205, "×3", "÷2"),
      E(245, 140),
      F(280, -1, 14),
      G(315, "÷3", "×2"),
      E(355, 200, 1.5),
      B(390, 1),
      G(425, "−60", "+50"),
      E(465, 220),
      F(500, 0, 14),
      G(535, "×2", "−40"),
      E(570, 260),
    ],
  },
  {
    id: 9,
    name: "سهل الذئاب",
    length: 640,
    boss: { hp: 2700, slam: 19, every: 2.3, kind: "chief" },
    entities: [
      G(40, "+15", "×3"),
      E(75, 16),
      G(110, "×2", "−25"),
      F(145, 0, 14),
      E(180, 60),
      B(210, 1),
      G(245, "÷2", "×3"),
      E(285, 220, -1),
      F(320, 1, 14),
      G(355, "+60", "−50"),
      E(395, 260, 1),
      W(430, -1, 10, 10, 90),
      G(465, "×2", "÷3"),
      E(505, 320),
      F(540, -1, 14),
      G(570, "−80", "+60"),
      E(605, 360),
    ],
  },
  {
    id: 10,
    name: "عرش الصحراء",
    length: 700,
    boss: { hp: 3800, slam: 24, every: 2.2, kind: "fort" },
    entities: [
      G(40, "×2", "+20"),
      G(75, "−20", "+25"),
      E(110, 70),
      F(140, 1, 14),
      B(170, -1),
      G(205, "×3", "÷2"),
      E(245, 180),
      F(280, 0, 14),
      G(315, "÷2", "×2"),
      E(355, 280, 1.5),
      S(390, -1, "+80"),
      F(390, 1, 14),
      E(430, 320, -1),
      G(470, "×2", "−90"),
      B(500, 0),
      E(540, 380),
      F(575, -1, 14),
      G(610, "+100", "÷3"),
      E(650, 450),
    ],
  },
];

/** Boss health is tuned so the final fight lasts a few tense seconds (Codex review, Oct 30 2026). */
const BOSS_HP_SCALE = 4;
export const LEVELS: LevelSpec[] = RAW_LEVELS.map((L) => ({ ...L, boss: { ...L.boss, hp: Math.round(L.boss.hp * BOSS_HP_SCALE) } }));

/** Mulberry32 — tiny seeded RNG so an endless stage is the same every time. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Endless stage k (1-based). The army carries over between stages, so enemies
 * scale with the stage and with the army the player brings in.
 */
export function endlessStage(k: number, armyIn: number): LevelSpec {
  const r = rng(9001 + k * 7919);
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const d = 1 + k * 0.3;
  let est = Math.max(15, armyIn); // what a good player would have at this point
  const length = Math.min(560, 340 + k * 20);
  const entities: EntitySpec[] = [];
  let at = 40;
  let i = 0;
  let muls = 0;
  while (at < length - 35) {
    const kind = i % 3 === 0 ? "gates" : pick(["enemy", "enemy", "enemy", "fire", "bow", "gates", "grow"]);
    if (kind === "gates") {
      const useMul = muls < 2 && est < 300 && r() < 0.45;
      const g = useMul ? `x${est < 80 ? pick([2, 3]) : 2}` : `+${Math.round(6 + r() * 10 * d)}`;
      if (useMul) muls++;
      const bad = r() < 0.5 ? `-${Math.round(est * (0.2 + r() * 0.25) + 5)}` : `/${pick([2, 2, 3])}`;
      entities.push(r() < 0.5 ? G(at, g, bad) : G(at, bad, g));
      est = applyOp(est, op(g));
    } else if (kind === "enemy") {
      const c = Math.round(est * (0.34 + r() * 0.22 + Math.min(0.3, k * 0.02)) + 6 * d);
      entities.push(E(at, c, pick([-1.5, 0, 0, 1.5])));
      est = Math.max(10, est - Math.round(c * 0.75));
    } else if (kind === "fire") {
      entities.push(F(at, pick([-1, 0, 1] as Side[]), 12));
    } else if (kind === "bow") {
      entities.push(B(at, pick([-1, 0, 1] as Side[])));
    } else {
      const start = Math.round(3 + d * 2);
      entities.push(W(at, pick([-1, 1] as const), start, Math.round(6 + d), 99));
      est += start + 4;
    }
    at += 32 + Math.round(r() * 10);
    i++;
  }
  return {
    id: 100 + k,
    name: `المرحلة ${k}`,
    length,
    boss: {
      hp: Math.round(est * 20 * d),
      slam: Math.round(est * 0.07 + 2 * d),
      every: Math.max(1.8, 2.7 - k * 0.05),
      kind: k % 2 ? "chief" : "fort",
    },
    entities,
  };
}
