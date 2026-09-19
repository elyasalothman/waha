import { mulberry32, type Rng } from "./rng.ts";

export type Tube = number[];
export type AbiState = {
  tubes: Tube[];
  cap: number;
  moves: number;
  colors: number;
};

export function topRun(tube: Tube): { color: number; count: number } | null {
  if (!tube.length) return null;
  const color = tube[tube.length - 1]!;
  let count = 0;
  for (let i = tube.length - 1; i >= 0 && tube[i] === color; i--) count++;
  return { color, count };
}

export function canPour(from: Tube, to: Tube, cap: number): boolean {
  if (from.length === 0 || to.length >= cap) return false;
  const run = topRun(from);
  if (!run) return false;
  if (to.length === 0) return true;
  return to[to.length - 1] === run.color;
}

export function pour(state: AbiState, i: number, j: number): AbiState | null {
  if (i === j) return null;
  const from = state.tubes[i];
  const to = state.tubes[j];
  if (!from || !to || !canPour(from, to, state.cap)) return null;
  const nextFrom = [...from];
  const nextTo = [...to];
  const run = topRun(nextFrom)!;
  const space = state.cap - nextTo.length;
  const n = Math.min(run.count, space);
  for (let k = 0; k < n; k++) {
    nextFrom.pop();
    nextTo.push(run.color);
  }
  return {
    ...state,
    moves: state.moves + 1,
    tubes: state.tubes.map((t, idx) => (idx === i ? nextFrom : idx === j ? nextTo : t)),
  };
}

export function isSolved(state: AbiState): boolean {
  return state.tubes.every(
    (t) => t.length === 0 || (t.length === state.cap && t.every((c) => c === t[0])),
  );
}

export function legalMoves(state: AbiState): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < state.tubes.length; i++) {
    for (let j = 0; j < state.tubes.length; j++) {
      if (i !== j && canPour(state.tubes[i]!, state.tubes[j]!, state.cap)) out.push([i, j]);
    }
  }
  return out;
}

function solvedState(colors: number, cap: number, empty: number): AbiState {
  const tubes: Tube[] = [];
  for (let c = 1; c <= colors; c++) tubes.push(Array(cap).fill(c));
  for (let i = 0; i < empty; i++) tubes.push([]);
  return { tubes, cap, moves: 0, colors };
}

function reverseMix(state: AbiState, rng: Rng): AbiState | null {
  const froms: number[] = [];
  const tos: number[] = [];
  state.tubes.forEach((tube, idx) => {
    if (tube.length) froms.push(idx);
    if (tube.length < state.cap) tos.push(idx);
  });
  for (let attempt = 0; attempt < 16; attempt++) {
    if (!froms.length || !tos.length) return null;
    const i = froms[Math.floor(rng() * froms.length)]!;
    const j = tos[Math.floor(rng() * tos.length)]!;
    if (i === j) continue;
    const from = [...state.tubes[i]!];
    const to = [...state.tubes[j]!];
    const run = topRun(from);
    if (!run) continue;
    const space = state.cap - to.length;
    if (space <= 0) continue;
    const n = 1 + Math.floor(rng() * Math.min(run.count, space));
    for (let k = 0; k < n; k++) to.push(from.pop()!);
    return {
      ...state,
      tubes: state.tubes.map((tube, idx) => (idx === i ? from : idx === j ? to : tube)),
    };
  }
  return null;
}

function scramble(state: AbiState, rng: Rng, steps: number): AbiState {
  let cur = state;
  for (let s = 0; s < steps; s++) {
    const next = reverseMix(cur, rng);
    if (!next) break;
    cur = next;
  }
  return { ...cur, moves: 0 };
}

export function colorsForLevel(level: number): number {
  return Math.min(8, 3 + Math.max(0, level - 1));
}

export function generateLevel(level: number, seed = level * 9973 + 11): AbiState {
  const colors = colorsForLevel(level);
  const cap = 4;
  const empty = colors >= 7 ? 3 : 2;
  const rng = mulberry32(seed >>> 0);
  const base = solvedState(colors, cap, empty);
  const steps = 18 + level * 10 + colors * 4;
  let puzzle = scramble(base, rng, steps);
  let guard = 0;
  while (isSolved(puzzle) && guard < 8) {
    puzzle = scramble(base, mulberry32((seed + guard * 17) >>> 0), steps + 12);
    guard++;
  }
  return puzzle;
}

export function colorHex(n: number): string {
  const palette = ["#6f9b7a", "#b8956a", "#7f93a3", "#c45c4a", "#8e7fa8", "#c4b07a", "#6e9a96", "#b07a7a"];
  return palette[(n - 1) % palette.length]!;
}
