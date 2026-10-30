/**
 * جيش الواحة — pure, deterministic simulation. No DOM, no three.js.
 * The renderer reads `state` each frame and drains `events`.
 */
import { ARMY_CAP, applyOp, isGood, type BossSpec, type EntitySpec, type GateOp, type LevelSpec, type Side } from "./levels.ts";

export const LANE = 5; // half width in metres
export const RUN_SPEED = 13;
export const RANGE = 30;
export const VISIBLE_CAP = 260;
export const BOSS_GAP = 17; // boss stands this far beyond the stop line

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const SPACING = 0.42;

/** Sunflower formation slot i, relative to the army centre (x, back-offset). */
export function slot(i: number): { x: number; z: number } {
  const r = SPACING * Math.sqrt(i + 0.5);
  const a = i * GOLDEN;
  return { x: Math.cos(a) * r, z: Math.sin(a) * r };
}

export function formationRadius(n: number): number {
  return SPACING * Math.sqrt(Math.min(n, VISIBLE_CAP) + 0.5) + 0.35;
}

/** Horizontal squeeze so a big army still fits between the parapets. */
export function squeeze(n: number, armyX: number): number {
  const r = formationRadius(n);
  const room = LANE - 0.35 - Math.abs(armyX);
  return r > room ? Math.max(0.35, room / r) : 1;
}

export function maxArmyX(n: number): number {
  return Math.max(1.4, LANE - 0.45 - formationRadius(n) * 0.8);
}

export function fireBand(side: Side): [number, number] {
  if (side === 0) return [-1.4, 1.4];
  return side < 0 ? [-LANE, -0.5] : [0.5, LANE];
}

export type Upgrades = { start: number; rate: number; income: number };

export type RtGate = { id: number; at: number; left?: GateOp; right?: GateOp; used: boolean; picked?: -1 | 1 };
export type RtGrow = { id: number; at: number; side: -1 | 1; value: number; hp: number; acc: number; max: number; used: boolean };
export type RtEnemy = { id: number; at: number; count: number; start: number; x: number; awake: boolean; dead: boolean };
export type RtBow = { id: number; at: number; side: Side; taken: boolean };
export type RtFire = { id: number; at: number; side: Side; len: number; done: boolean };

export type GameEvent =
  | { t: "gate"; id: number; side: -1 | 1; good: boolean; before: number; after: number }
  | { t: "grow"; id: number; value: number }
  | { t: "growHit"; id: number; value: number }
  | { t: "enemyKilled"; id: number; n: number }
  | { t: "armyKilled"; n: number; reason: "clash" | "fire" | "slam" }
  | { t: "clashStart"; id: number }
  | { t: "clashEnd"; id: number; won: boolean }
  | { t: "bow"; id: number; stacks: number }
  | { t: "fire"; id: number; killed: number }
  | { t: "shoot"; n: number; tx: number; tdist: number; kind: "enemy" | "grow" | "boss" }
  | { t: "bossArrive" }
  | { t: "bossHit"; dmg: number }
  | { t: "slam"; killed: number }
  | { t: "won" }
  | { t: "lost" };

export type Phase = "run" | "clash" | "boss" | "won" | "lost";

export type GameState = {
  level: LevelSpec;
  phase: Phase;
  time: number;
  army: { n: number; x: number; targetX: number; dist: number; stacks: number; peak: number };
  gates: RtGate[];
  grows: RtGrow[];
  enemies: RtEnemy[];
  bows: RtBow[];
  fires: RtFire[];
  boss: { spec: BossSpec; hp: number; max: number; timer: number; arrived: boolean; at: number };
  clashWith: number | null;
  shotAcc: number;
  clashAcc: number;
  dmgAcc: number;
  killed: number;
  events: GameEvent[];
  rateMult: number;
};

export function startArmy(u: Upgrades): number {
  return 4 + 2 * u.start;
}

export function rateMultFor(u: Upgrades): number {
  return 1 + 0.1 * u.rate;
}

export function createGame(level: LevelSpec, u: Upgrades, carry?: { n: number; stacks: number }): GameState {
  let id = 0;
  const gates: RtGate[] = [];
  const grows: RtGrow[] = [];
  const enemies: RtEnemy[] = [];
  const bows: RtBow[] = [];
  const fires: RtFire[] = [];
  for (const e of level.entities as EntitySpec[]) {
    id++;
    if (e.type === "gates") gates.push({ id, at: e.at, left: e.left, right: e.right, used: false });
    else if (e.type === "gate")
      gates.push({ id, at: e.at, [e.side < 0 ? "left" : "right"]: e.op, used: false } as RtGate);
    else if (e.type === "grow")
      grows.push({ id, at: e.at, side: e.side, value: e.start, hp: e.hp, acc: 0, max: e.max, used: false });
    else if (e.type === "enemy")
      enemies.push({ id, at: e.at, count: e.count, start: e.count, x: e.x, awake: false, dead: false });
    else if (e.type === "bow") bows.push({ id, at: e.at, side: e.side, taken: false });
    else fires.push({ id, at: e.at, side: e.side, len: e.len, done: false });
  }
  const n = carry?.n ?? startArmy(u);
  return {
    level,
    phase: "run",
    time: 0,
    army: { n, x: 0, targetX: 0, dist: 0, stacks: carry?.stacks ?? 0, peak: n },
    gates,
    grows,
    enemies,
    bows,
    fires,
    boss: { spec: level.boss, hp: level.boss.hp, max: level.boss.hp, timer: 1.4, arrived: false, at: level.length + BOSS_GAP },
    clashWith: null,
    shotAcc: 0,
    clashAcc: 0,
    dmgAcc: 0,
    killed: 0,
    events: [],
    rateMult: rateMultFor(u),
  };
}

/** Shots per second for the whole army (the back rows can only lob a few). */
export function shotsPerSecond(s: GameState): number {
  const n = s.army.n;
  const eff = Math.min(n, 110) + 0.35 * Math.max(0, n - 110);
  return eff * 1.35 * s.rateMult * (1 + 0.35 * s.army.stacks);
}

export function damagePerShot(s: GameState): number {
  return 1 + 0.5 * s.army.stacks;
}

export function steer(s: GameState, x: number) {
  const m = maxArmyX(s.army.n);
  s.army.targetX = Math.max(-m, Math.min(m, x));
}

function kill(s: GameState, n: number, reason: "clash" | "fire" | "slam") {
  if (!Number.isFinite(n)) return;
  const k = Math.min(s.army.n, Math.max(0, Math.round(n)));
  if (k <= 0) return;
  s.army.n -= k;
  s.events.push({ t: "armyKilled", n: k, reason });
}

function setN(s: GameState, n: number) {
  s.army.n = n;
  if (n > s.army.peak) s.army.peak = n;
}

/** Advance the simulation by dt seconds. */
export function step(s: GameState, dt: number) {
  if (s.phase === "won" || s.phase === "lost") return;
  dt = Math.min(dt, 0.05);
  s.time += dt;
  const a = s.army;

  // steering: ease toward target
  const maxX = maxArmyX(a.n);
  a.targetX = Math.max(-maxX, Math.min(maxX, a.targetX));
  a.x += (a.targetX - a.x) * Math.min(1, dt * 12);

  // enemies wake and march
  for (const e of s.enemies) {
    if (e.dead) continue;
    if (!e.awake && e.at - a.dist < 46) e.awake = true;
    if (e.awake && s.clashWith !== e.id && s.phase === "run") e.at -= 3.2 * dt;
  }

  // movement
  const stopLine = s.level.length;
  if (s.phase === "run") {
    let speed = RUN_SPEED;
    const next = a.dist + speed * dt;
    // clash detection: enemy front within formation radius
    const r = formationRadius(a.n);
    for (const e of s.enemies) {
      if (e.dead) continue;
      const er = formationRadius(e.count);
      if (e.at - er - (next + r * 0.6) <= 0) {
        s.phase = "clash";
        s.clashWith = e.id;
        s.events.push({ t: "clashStart", id: e.id });
        speed = 0;
        break;
      }
    }
    if (s.phase === "run") {
      const prev = a.dist;
      a.dist = Math.min(next, stopLine);
      crossings(s, prev, a.dist);
      if (a.dist >= stopLine && s.phase === "run" && a.n > 0) {
        s.phase = "boss";
        s.boss.arrived = true;
        s.events.push({ t: "bossArrive" });
      }
    }
  }

  // shooting
  shoot(s, dt);

  // clash resolution
  if (s.phase === "clash" && s.clashWith != null) {
    const e = s.enemies.find((x) => x.id === s.clashWith)!;
    if (!e.dead) {
      const rate = 14 + 1.1 * Math.min(a.n, e.count);
      s.clashAcc += rate * dt;
      const hit = Math.min(Math.floor(s.clashAcc), e.count, a.n);
      if (hit > 0) {
        s.clashAcc -= hit;
        e.count -= hit;
        s.killed += hit;
        s.events.push({ t: "enemyKilled", id: e.id, n: hit });
        kill(s, hit, "clash");
      }
    }
    if (e.count <= 0) {
      e.dead = true;
      s.events.push({ t: "clashEnd", id: e.id, won: a.n > 0 });
      s.clashWith = null;
      if (a.n > 0) s.phase = "run";
    }
  }

  // boss fight
  if (s.phase === "boss") {
    const b = s.boss;
    b.timer -= dt;
    if (b.timer <= 0 && b.hp > 0) {
      b.timer = b.spec.every;
      const killed = Math.min(a.n, b.spec.slam);
      kill(s, killed, "slam");
      s.events.push({ t: "slam", killed });
    }
    if (b.hp <= 0) {
      s.phase = "won";
      s.events.push({ t: "won" });
    }
  }

  if (a.n <= 0 && s.phase !== "won") {
    a.n = 0;
    s.phase = "lost";
    s.events.push({ t: "lost" });
  }
}

function crossings(s: GameState, prev: number, now: number) {
  const a = s.army;
  for (const g of s.gates) {
    if (g.used || g.at > now || g.at < prev) continue;
    g.used = true;
    const side: -1 | 1 = a.x < 0 ? -1 : 1;
    const o = side < 0 ? g.left : g.right;
    if (!o) continue; // walked past the empty side of a single gate
    g.picked = side;
    const before = a.n;
    setN(s, applyOp(a.n, o));
    s.events.push({ t: "gate", id: g.id, side, good: isGood(o), before, after: a.n });
  }
  for (const w of s.grows) {
    if (w.used || w.at > now || w.at < prev) continue;
    w.used = true;
    const side: -1 | 1 = a.x < 0 ? -1 : 1;
    if (side !== w.side) continue;
    const before = a.n;
    setN(s, Math.min(ARMY_CAP, a.n + w.value));
    s.events.push({ t: "gate", id: w.id, side, good: true, before, after: a.n });
  }
  for (const b of s.bows) {
    if (b.taken || b.at > now || b.at < prev) continue;
    const bx = b.side * 2.6;
    if (Math.abs(a.x - bx) <= 1.6 + formationRadius(a.n) * 0.5) {
      b.taken = true;
      a.stacks = Math.min(3, a.stacks + 1);
      s.events.push({ t: "bow", id: b.id, stacks: a.stacks });
    }
  }
  for (const f of s.fires) {
    if (f.done || f.at > now || f.at < prev) continue;
    f.done = true;
    const killed = fireLosses(a.n, a.x, f.side);
    kill(s, killed, "fire");
    s.events.push({ t: "fire", id: f.id, killed });
  }
}

/** How many soldiers of an army of n centred at x stand inside a fire band. */
export function fireLosses(n: number, x: number, side: Side): number {
  if (!(n > 0)) return 0;
  const [lo, hi] = fireBand(side);
  const shown = Math.min(n, VISIBLE_CAP);
  const sq = squeeze(n, x);
  let inside = 0;
  for (let i = 0; i < shown; i++) {
    const px = x + slot(i).x * sq;
    if (px >= lo && px <= hi) inside++;
  }
  return Math.round((inside / shown) * n);
}

function shoot(s: GameState, dt: number) {
  const a = s.army;
  if (a.n <= 0) return;
  // pick a target
  let target: { kind: "enemy" | "grow" | "boss"; dist: number; x: number; ref: RtEnemy | RtGrow | null } | null = null;
  let best = Infinity;
  for (const e of s.enemies) {
    if (e.dead) continue;
    const d = e.at - a.dist;
    if (d > -2 && d < RANGE && d < best) {
      best = d;
      target = { kind: "enemy", dist: e.at, x: e.x, ref: e };
    }
  }
  if (!target) {
    const side: -1 | 1 = a.x < 0 ? -1 : 1;
    for (const w of s.grows) {
      if (w.used || w.side !== side || w.value >= w.max) continue;
      const d = w.at - a.dist;
      if (d > 2 && d < RANGE && d < best) {
        best = d;
        target = { kind: "grow", dist: w.at, x: w.side * 2.5, ref: w };
      }
    }
  }
  if (!target && s.boss.hp > 0 && s.phase === "boss") {
    target = { kind: "boss", dist: s.boss.at, x: 0, ref: null };
  }
  if (!target) {
    s.shotAcc = 0;
    return;
  }
  s.shotAcc += shotsPerSecond(s) * dt;
  const shots = Math.floor(s.shotAcc);
  if (shots <= 0) return;
  s.shotAcc -= shots;
  const dmg = shots * damagePerShot(s);
  s.events.push({ t: "shoot", n: shots, tx: target.x, tdist: target.dist, kind: target.kind });
  if (target.kind === "enemy") {
    const e = target.ref as RtEnemy;
    s.dmgAcc += dmg;
    const k = Math.min(e.count, Math.floor(s.dmgAcc));
    s.dmgAcc -= k;
    if (k > 0) {
      e.count -= k;
      s.killed += k;
      s.events.push({ t: "enemyKilled", id: e.id, n: k });
    }
    if (e.count <= 0 && !e.dead) {
      e.dead = true;
      if (s.clashWith === e.id) {
        s.clashWith = null;
        s.events.push({ t: "clashEnd", id: e.id, won: true });
        if (s.phase === "clash") s.phase = "run";
      }
    }
  } else if (target.kind === "grow") {
    const w = target.ref as RtGrow;
    w.acc += dmg;
    let grew = false;
    while (w.acc >= w.hp && w.value < w.max) {
      w.acc -= w.hp;
      w.value++;
      grew = true;
    }
    if (grew) s.events.push({ t: "grow", id: w.id, value: w.value });
    else s.events.push({ t: "growHit", id: w.id, value: w.value });
  } else {
    s.boss.hp = Math.max(0, s.boss.hp - dmg);
    s.events.push({ t: "bossHit", dmg });
  }
}

/** Fraction of the level run so far (0..1), boss counts as the last 10%. */
export function progress(s: GameState): number {
  const run = Math.min(1, s.army.dist / s.level.length) * 0.9;
  const boss = s.boss.arrived ? 0.1 * (1 - s.boss.hp / s.boss.max) : 0;
  return run + boss;
}

export function coinsFor(s: GameState, u: Upgrades): number {
  const mult = 1 + 0.15 * u.income;
  const lvl = Math.min(s.level.id, 30);
  if (s.phase === "won") return Math.round((12 + lvl * 6 + Math.min(s.army.n, 600) * 0.6) * mult);
  return Math.round(progress(s) * (6 + lvl * 3) * mult);
}

/**
 * Simple autopilot: aims at the better gate, dodges fire, grabs bows.
 * Used by the title-screen demo and by the balance tests.
 */
export function autopilot(s: GameState, skill = 1): number {
  const a = s.army;
  const ahead = (at: number) => at - a.dist;
  type Want = { d: number; x: number };
  const wants: Want[] = [];
  for (const g of s.gates) {
    if (g.used || ahead(g.at) < 0 || ahead(g.at) > 40) continue;
    const l = g.left ? applyOp(a.n, g.left) : a.n;
    const r = g.right ? applyOp(a.n, g.right) : a.n;
    const pickLeft = skill >= 1 ? l >= r : skill <= 0 ? l < r : (g.id % 2 === 0) === l >= r;
    wants.push({ d: ahead(g.at), x: pickLeft ? -3 : 3 });
  }
  for (const w of s.grows) {
    if (w.used || ahead(w.at) < 0 || ahead(w.at) > 40) continue;
    if (skill >= 1) wants.push({ d: ahead(w.at), x: w.side * 3 });
  }
  for (const f of s.fires) {
    if (f.done || ahead(f.at) < 0 || ahead(f.at) > 30) continue;
    if (skill >= 1) {
      let bestX = 0;
      let bestK = Infinity;
      for (const x of [-4, -2.5, 0, 2.5, 4]) {
        const k = fireLosses(a.n, x, f.side);
        if (k < bestK) {
          bestK = k;
          bestX = x;
        }
      }
      wants.push({ d: ahead(f.at), x: bestX });
    }
  }
  for (const b of s.bows) {
    if (b.taken || ahead(b.at) < 0 || ahead(b.at) > 30) continue;
    if (skill >= 1) wants.push({ d: ahead(b.at) + 6, x: b.side * 2.6 });
  }
  wants.sort((p, q) => p.d - q.d);
  return wants.length ? wants[0].x : 0;
}

/** Run a whole level headless (tests / balance). */
export function simulate(level: LevelSpec, u: Upgrades, skill = 1, carry?: { n: number; stacks: number }) {
  const s = createGame(level, u, carry);
  let guard = 0;
  while (s.phase !== "won" && s.phase !== "lost" && guard++ < 60 * 400) {
    steer(s, autopilot(s, skill));
    step(s, 1 / 60);
    s.events.length = 0;
  }
  return s;
}
