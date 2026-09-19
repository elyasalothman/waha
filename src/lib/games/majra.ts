/** مجرى — rotate channels until the spring reaches the oasis. */

export const MAJRA_N = 6;

export type PipeKind = "I" | "L" | "T" | "X";
export type Rot = 0 | 1 | 2 | 3;
export type PipeCell = { kind: PipeKind; rot: Rot };
export type MajraGrid = PipeCell[][];

const DIRS = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
] as const;

/** Open sides at rot 0: N E S W */
const SHAPE: Record<PipeKind, [boolean, boolean, boolean, boolean]> = {
  I: [true, false, true, false],
  L: [true, true, false, false],
  T: [true, true, true, false],
  X: [true, true, true, true],
};

export function sides(cell: PipeCell): [boolean, boolean, boolean, boolean] {
  const base = SHAPE[cell.kind];
  const out: [boolean, boolean, boolean, boolean] = [false, false, false, false];
  for (let i = 0; i < 4; i++) out[i] = base[(i - cell.rot + 4) % 4]!;
  return out;
}

export function rotatePipe(cell: PipeCell): PipeCell {
  return { kind: cell.kind, rot: ((cell.rot + 1) % 4) as Rot };
}

function inb(r: number, c: number) {
  return r >= 0 && r < MAJRA_N && c >= 0 && c < MAJRA_N;
}

function pipeFor(open: [boolean, boolean, boolean, boolean]): PipeCell {
  for (const kind of ["X", "T", "L", "I"] as const) {
    for (let rot = 0; rot < 4; rot++) {
      const cell = { kind, rot: rot as Rot };
      const s = sides(cell);
      if (s.every((v, i) => v === open[i])) return cell;
    }
  }
  return { kind: "I", rot: 0 };
}

export function generateMajra(rand = Math.random): MajraGrid {
  const startC = Math.floor(rand() * MAJRA_N);
  const path: [number, number][] = [[0, startC]];
  const seen = new Set<string>([`0,${startC}`]);
  let r = 0;
  let c = startC;
  let guard = 0;
  while (r < MAJRA_N - 1 && guard < 80) {
    guard += 1;
    const opts: [number, number][] = [];
    if (inb(r + 1, c) && !seen.has(`${r + 1},${c}`)) opts.push([r + 1, c]);
    if (inb(r, c - 1) && !seen.has(`${r},${c - 1}`)) opts.push([r, c - 1]);
    if (inb(r, c + 1) && !seen.has(`${r},${c + 1}`)) opts.push([r, c + 1]);
    if (!opts.length) {
      if (inb(r + 1, c)) opts.push([r + 1, c]);
      else break;
    }
    const next = opts[Math.floor(rand() * opts.length)]!;
    r = next[0];
    c = next[1];
    path.push([r, c]);
    seen.add(`${r},${c}`);
  }
  if (path[path.length - 1]![0] !== MAJRA_N - 1) {
    const last = path[path.length - 1]!;
    for (let rr = last[0] + 1; rr < MAJRA_N; rr++) path.push([rr, last[1]]);
  }

  const open = Array.from({ length: MAJRA_N }, () =>
    Array.from({ length: MAJRA_N }, () => [false, false, false, false] as [boolean, boolean, boolean, boolean]),
  );
  for (let i = 0; i < path.length - 1; i++) {
    const [r1, c1] = path[i]!;
    const [r2, c2] = path[i + 1]!;
    const dr = r2 - r1;
    const dc = c2 - c1;
    const dir = DIRS.findIndex(([a, b]) => a === dr && b === dc);
    const opp = (dir + 2) % 4;
    open[r1]![c1]![dir] = true;
    open[r2]![c2]![opp] = true;
  }
  open[path[0]![0]]![path[0]![1]]![0] = true;
  const end = path[path.length - 1]!;
  open[end[0]]![end[1]]![2] = true;

  const kinds: PipeKind[] = ["I", "L", "T", "X"];
  const grid: MajraGrid = Array.from({ length: MAJRA_N }, (_, rr) =>
    Array.from({ length: MAJRA_N }, (_, cc) => {
      if (open[rr]![cc]!.some(Boolean)) return pipeFor(open[rr]![cc]!);
      return { kind: kinds[Math.floor(rand() * 3)]!, rot: Math.floor(rand() * 4) as Rot };
    }),
  );

  for (let rr = 0; rr < MAJRA_N; rr++) {
    for (let cc = 0; cc < MAJRA_N; cc++) {
      const spin = 1 + Math.floor(rand() * 3);
      for (let k = 0; k < spin; k++) grid[rr]![cc] = rotatePipe(grid[rr]![cc]!);
    }
  }
  return grid;
}

export function rotateMajra(grid: MajraGrid, r: number, c: number): MajraGrid {
  return grid.map((row, rr) => row.map((cell, cc) => (rr === r && cc === c ? rotatePipe(cell) : cell)));
}

export function majraFlow(grid: MajraGrid): { filled: boolean[][]; won: boolean; startC: number } {
  const filled = Array.from({ length: MAJRA_N }, () => Array(MAJRA_N).fill(false));
  let startC = 0;
  const q: [number, number, number][] = [];
  for (let c = 0; c < MAJRA_N; c++) {
    if (sides(grid[0]![c]!)[0]) {
      q.push([0, c, 0]);
      startC = c;
    }
  }
  const seen = new Set<string>();
  while (q.length) {
    const [r, c, from] = q.shift()!;
    const key = `${r},${c},${from}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!inb(r, c)) continue;
    const s = sides(grid[r]![c]!);
    if (!s[from]) continue;
    filled[r]![c] = true;
    for (let d = 0; d < 4; d++) {
      if (!s[d] || d === from) continue;
      const nr = r + DIRS[d]![0];
      const nc = c + DIRS[d]![1];
      const opp = (d + 2) % 4;
      q.push([nr, nc, opp]);
    }
  }
  const won = filled[MAJRA_N - 1]!.some((v, c) => v && sides(grid[MAJRA_N - 1]![c]!)[2]);
  return { filled, won, startC };
}

export function majraSolved(grid: MajraGrid): boolean {
  return majraFlow(grid).won;
}
