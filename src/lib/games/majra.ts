import { mulberry32, type Rng } from "./rng.ts";

export type Dir = "N" | "E" | "S" | "W";
export type Kind = "I" | "L" | "T" | "X" | "source" | "sink" | "empty";
export type Rot = 0 | 1 | 2 | 3;
export type Cell = { kind: Kind; rot: Rot };
export type Point = { x: number; y: number };

export const DIRS: Dir[] = ["N", "E", "S", "W"];
export const DELTA: Record<Dir, Point> = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
};
export const OPP: Record<Dir, Dir> = { N: "S", E: "W", S: "N", W: "E" };

const BASE: Record<Kind, Dir[]> = {
  I: ["N", "S"],
  L: ["N", "E"],
  T: ["W", "N", "E"],
  X: ["N", "E", "S", "W"],
  source: ["E"],
  sink: ["W"],
  empty: [],
};

export function rotateDir(dir: Dir, rot: number): Dir {
  return DIRS[(DIRS.indexOf(dir) + (rot % 4) + 4) % 4]!;
}

export function openings(cell: Cell): Dir[] {
  return BASE[cell.kind].map((d) => rotateDir(d, cell.rot));
}

export function rotateCell(cell: Cell): Cell {
  if (cell.kind === "empty" || cell.kind === "X") return cell;
  if (cell.kind === "source" || cell.kind === "sink") return cell;
  return { ...cell, rot: ((cell.rot + 1) % 4) as Rot };
}

function kindFor(dirs: Dir[]): { kind: Kind; rot: Rot } {
  const set = new Set(dirs);
  if (set.size === 4) return { kind: "X", rot: 0 };
  for (const kind of ["I", "L", "T"] as const) {
    for (let rot = 0; rot < 4; rot++) {
      const open = BASE[kind].map((d) => rotateDir(d, rot));
      if (open.length === dirs.length && dirs.every((d) => open.includes(d))) {
        return { kind, rot: rot as Rot };
      }
    }
  }
  return { kind: "L", rot: 0 };
}

function inBounds(w: number, h: number, p: Point) {
  return p.x >= 0 && p.y >= 0 && p.x < w && p.y < h;
}

function neighbors(w: number, h: number, p: Point): Point[] {
  return DIRS.map((d) => ({ x: p.x + DELTA[d].x, y: p.y + DELTA[d].y })).filter((q) => inBounds(w, h, q));
}

function key(p: Point) {
  return `${p.x},${p.y}`;
}

function dirBetween(a: Point, b: Point): Dir {
  if (b.x === a.x + 1) return "E";
  if (b.x === a.x - 1) return "W";
  if (b.y === a.y + 1) return "S";
  return "N";
}

function walk(w: number, h: number, start: Point, end: Point, rng: Rng): Point[] | null {
  const path: Point[] = [start];
  const seen = new Set([key(start)]);
  while (true) {
    const cur = path[path.length - 1]!;
    if (cur.x === end.x && cur.y === end.y) return path;
    const opts = neighbors(w, h, cur).filter((n) => !seen.has(key(n)));
    if (!opts.length) return null;
    opts.sort((a, b) => {
      const da = Math.abs(a.x - end.x) + Math.abs(a.y - end.y);
      const db = Math.abs(b.x - end.x) + Math.abs(b.y - end.y);
      if (da !== db && rng() < 0.72) return da - db;
      return rng() - 0.5;
    });
    const next = opts[0]!;
    path.push(next);
    seen.add(key(next));
    if (path.length > w * h) return null;
  }
}

function fallbackPath(w: number, h: number, start: Point, end: Point): Point[] {
  const path: Point[] = [start];
  let x = start.x;
  let y = start.y;
  while (x !== end.x) {
    x += x < end.x ? 1 : -1;
    path.push({ x, y });
  }
  while (y !== end.y) {
    y += y < end.y ? 1 : -1;
    path.push({ x, y });
  }
  return path;
}

export function emptyGrid(w: number, h: number): Cell[][] {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => ({ kind: "empty" as const, rot: 0 as Rot })));
}

export function generateLevel(level: number, seed = level * 4243 + 5): { grid: Cell[][]; w: number; h: number } {
  const w = Math.min(8, 4 + Math.floor((level - 1) / 2));
  const h = Math.min(8, 4 + Math.floor(level / 2));
  const rng = mulberry32(seed >>> 0);
  const start = { x: 0, y: Math.floor(h / 2) };
  const endY = Math.min(h - 1, Math.max(0, start.y + ((level + seed) % 3) - 1));
  const end = { x: w - 1, y: endY };
  let path: Point[] | null = null;
  for (let i = 0; i < 24 && !path; i++) path = walk(w, h, start, end, mulberry32((seed + i * 31) >>> 0));
  const used = path ?? fallbackPath(w, h, start, end);
  const grid = emptyGrid(w, h);
  const index = new Map(used.map((p, i) => [key(p), i]));

  for (let i = 0; i < used.length; i++) {
    const p = used[i]!;
    const dirs: Dir[] = [];
    if (i > 0) dirs.push(dirBetween(p, used[i - 1]!));
    if (i < used.length - 1) dirs.push(dirBetween(p, used[i + 1]!));
    if (i === 0) {
      grid[p.y]![p.x] = { kind: "source", rot: DIRS.indexOf(dirs[0] ?? "E") as Rot };
    } else if (i === used.length - 1) {
      grid[p.y]![p.x] = { kind: "sink", rot: DIRS.indexOf(dirs[0] ?? "W") as Rot };
    } else {
      grid[p.y]![p.x] = kindFor(dirs);
    }
  }

  const fillers: Kind[] = ["I", "L", "L", "T"];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (index.has(key({ x, y }))) continue;
      const kind = fillers[Math.floor(rng() * fillers.length)]!;
      grid[y]![x] = { kind, rot: Math.floor(rng() * 4) as Rot };
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cell = grid[y]![x]!;
      if (cell.kind === "source" || cell.kind === "sink" || cell.kind === "empty") continue;
      const twist = 1 + Math.floor(rng() * 3);
      grid[y]![x] = { ...cell, rot: ((cell.rot + twist) % 4) as Rot };
    }
  }

  return { grid, w, h };
}

export function wetCells(grid: Cell[][]): { wet: Set<string>; won: boolean } {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  let source: Point | null = null;
  let sink: Point | null = null;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y]![x]!.kind === "source") source = { x, y };
      if (grid[y]![x]!.kind === "sink") sink = { x, y };
    }
  }
  const wet = new Set<string>();
  if (!source) return { wet, won: false };
  const q: Point[] = [source];
  wet.add(key(source));
  while (q.length) {
    const cur = q.shift()!;
    const cell = grid[cur.y]![cur.x]!;
    for (const dir of openings(cell)) {
      const n = { x: cur.x + DELTA[dir].x, y: cur.y + DELTA[dir].y };
      if (!inBounds(w, h, n) || wet.has(key(n))) continue;
      const other = grid[n.y]![n.x]!;
      if (openings(other).includes(OPP[dir])) {
        wet.add(key(n));
        q.push(n);
      }
    }
  }
  const won = !!sink && wet.has(key(sink));
  return { wet, won };
}

export function sizeForLevel(level: number) {
  const w = Math.min(8, 4 + Math.floor((level - 1) / 2));
  const h = Math.min(8, 4 + Math.floor(level / 2));
  return { w, h };
}
