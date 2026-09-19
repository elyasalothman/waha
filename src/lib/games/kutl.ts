import { mulberry32, shuffle, type Rng } from "./rng.ts";

export const BOARD = 8;
export type Cell = 0 | 1;
export type Board = Cell[][];
export type Shape = [number, number][];

export type Piece = {
  id: string;
  cells: Shape;
};

const RAW: Shape[] = [
  [[0, 0]],
  [
    [0, 0],
    [0, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
  ],
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1],
  ],
  [
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ],
];

export function emptyBoard(): Board {
  return Array.from({ length: BOARD }, () => Array<Cell>(BOARD).fill(0));
}

export function normalize(cells: Shape): Shape {
  const minR = Math.min(...cells.map((c) => c[0]));
  const minC = Math.min(...cells.map((c) => c[1]));
  return cells.map(([r, c]) => [r - minR, c - minC]);
}

export function rotateShape(cells: Shape): Shape {
  return normalize(cells.map(([r, c]) => [c, -r]));
}

export function bounds(cells: Shape): { h: number; w: number } {
  return {
    h: Math.max(...cells.map((c) => c[0])) + 1,
    w: Math.max(...cells.map((c) => c[1])) + 1,
  };
}

export function canPlace(board: Board, cells: Shape, r: number, c: number): boolean {
  for (const [dr, dc] of cells) {
    const rr = r + dr;
    const cc = c + dc;
    if (rr < 0 || cc < 0 || rr >= BOARD || cc >= BOARD) return false;
    if (board[rr]![cc]) return false;
  }
  return true;
}

export function fitsAnywhere(board: Board, cells: Shape): boolean {
  for (let r = 0; r < BOARD; r++) {
    for (let c = 0; c < BOARD; c++) {
      if (canPlace(board, cells, r, c)) return true;
    }
  }
  return false;
}

export function anyFits(board: Board, pieces: (Piece | null)[]): boolean {
  return pieces.some((p) => p && fitsAnywhere(board, p.cells));
}

export function place(board: Board, cells: Shape, r: number, c: number): { board: Board; cleared: number; cells: number } {
  const next = board.map((row) => [...row]) as Board;
  for (const [dr, dc] of cells) next[r + dr]![c + dc] = 1;
  const fullRows: number[] = [];
  const fullCols: number[] = [];
  for (let i = 0; i < BOARD; i++) {
    if (next[i]!.every((v) => v === 1)) fullRows.push(i);
    if (next.every((row) => row[i] === 1)) fullCols.push(i);
  }
  for (const rr of fullRows) next[rr] = Array<Cell>(BOARD).fill(0);
  for (const cc of fullCols) {
    for (let rr = 0; rr < BOARD; rr++) next[rr]![cc] = 0;
  }
  return { board: next, cleared: fullRows.length + fullCols.length, cells: cells.length };
}

export function scoreGain(cells: number, cleared: number): number {
  const combo = cleared > 1 ? (cleared - 1) * 8 : 0;
  return cells + cleared * 12 + combo;
}

let pieceSeq = 0;

export function makePiece(cells: Shape, id?: string): Piece {
  return { id: id ?? `p${pieceSeq++}`, cells: normalize(cells) };
}

export function dealTrio(seed?: number): Piece[] {
  const rng: Rng = seed == null ? Math.random : mulberry32(seed >>> 0);
  const bag = shuffle(rng, RAW.map((s) => normalize(s)));
  return bag.slice(0, 3).map((cells, i) => makePiece(cells, `d${seed ?? Date.now()}-${i}`));
}
