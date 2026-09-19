/** آبار — survey the sand, mark the dry pits, open every safe well. */

export const ABAAR_N = 8;
export const ABAAR_PITS = 10;

export type AbaarCell = { pit: boolean; open: boolean; flag: boolean; n: number };
export type AbaarGrid = AbaarCell[][];

function neighbors(r: number, c: number): [number, number][] {
  const out: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr;
      const cc = c + dc;
      if (rr >= 0 && rr < ABAAR_N && cc >= 0 && cc < ABAAR_N) out.push([rr, cc]);
    }
  }
  return out;
}

export function emptyAbaar(): AbaarGrid {
  return Array.from({ length: ABAAR_N }, () =>
    Array.from({ length: ABAAR_N }, () => ({ pit: false, open: false, flag: false, n: 0 })),
  );
}

export function plantPits(safeR: number, safeC: number, rand = Math.random): boolean[][] {
  const pits = Array.from({ length: ABAAR_N }, () => Array(ABAAR_N).fill(false));
  const forbidden = new Set<string>([`${safeR},${safeC}`, ...neighbors(safeR, safeC).map(([r, c]) => `${r},${c}`)]);
  let placed = 0;
  let guard = 0;
  while (placed < ABAAR_PITS && guard < 800) {
    guard += 1;
    const r = Math.floor(rand() * ABAAR_N);
    const c = Math.floor(rand() * ABAAR_N);
    if (pits[r]![c] || forbidden.has(`${r},${c}`)) continue;
    pits[r]![c] = true;
    placed += 1;
  }
  return pits;
}

export function countAdjacent(pits: boolean[][], r: number, c: number): number {
  return neighbors(r, c).reduce((n, [rr, cc]) => n + (pits[rr]![cc] ? 1 : 0), 0);
}

export function buildAbaar(safeR: number, safeC: number, rand = Math.random): AbaarGrid {
  const pits = plantPits(safeR, safeC, rand);
  return Array.from({ length: ABAAR_N }, (_, r) =>
    Array.from({ length: ABAAR_N }, (_, c) => ({
      pit: pits[r]![c]!,
      open: false,
      flag: false,
      n: countAdjacent(pits, r, c),
    })),
  );
}

export function floodAbaar(grid: AbaarGrid, r: number, c: number): AbaarGrid {
  const next = grid.map((row) => row.map((cell) => ({ ...cell })));
  const stack = [[r, c]];
  while (stack.length) {
    const [cr, cc] = stack.pop()!;
    const cell = next[cr!]?.[cc!];
    if (!cell || cell.open || cell.flag || cell.pit) continue;
    cell.open = true;
    if (cell.n !== 0) continue;
    for (const [rr, cc2] of neighbors(cr!, cc!)) stack.push([rr, cc2]);
  }
  return next;
}

export function toggleAbaarFlag(grid: AbaarGrid, r: number, c: number): AbaarGrid {
  const next = grid.map((row) => row.map((cell) => ({ ...cell })));
  const cell = next[r]![c]!;
  if (cell.open) return grid;
  cell.flag = !cell.flag;
  return next;
}

export function abaarWon(grid: AbaarGrid): boolean {
  return grid.every((row) => row.every((cell) => cell.pit || cell.open));
}

export function abaarOpened(grid: AbaarGrid): number {
  return grid.flat().filter((c) => c.open && !c.pit).length;
}

export function abaarSafeCount(): number {
  return ABAAR_N * ABAAR_N - ABAAR_PITS;
}
