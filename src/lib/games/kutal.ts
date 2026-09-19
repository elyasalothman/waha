/** كتل — place polyominoes, clear full rows and columns. */

export const KUTAL_N = 8;

export type KutalBoard = number[][];
export type KutalPiece = { cells: [number, number][] };

export const KUTAL_SHAPES: KutalPiece[] = [
  { cells: [[0, 0]] },
  { cells: [[0, 0], [0, 1]] },
  { cells: [[0, 0], [1, 0]] },
  { cells: [[0, 0], [0, 1], [0, 2]] },
  { cells: [[0, 0], [1, 0], [2, 0]] },
  { cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  { cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  { cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
  { cells: [[0, 0], [1, 0], [1, 1]] },
  { cells: [[0, 1], [1, 0], [1, 1]] },
  { cells: [[0, 0], [0, 1], [1, 1]] },
  { cells: [[0, 0], [0, 1], [1, 0]] },
  { cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
  { cells: [[0, 1], [1, 1], [2, 0], [2, 1]] },
  { cells: [[0, 0], [0, 1], [0, 2], [1, 2]] },
  { cells: [[0, 0], [1, 0], [1, 1], [1, 2]] },
  { cells: [[0, 1], [1, 0], [1, 1], [1, 2]] },
  { cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
];

export function emptyKutal(): KutalBoard {
  return Array.from({ length: KUTAL_N }, () => Array(KUTAL_N).fill(0));
}

export function pieceBounds(piece: KutalPiece): { h: number; w: number } {
  let h = 0;
  let w = 0;
  for (const [r, c] of piece.cells) {
    if (r + 1 > h) h = r + 1;
    if (c + 1 > w) w = c + 1;
  }
  return { h, w };
}

export function canPlaceKutal(board: KutalBoard, piece: KutalPiece, r: number, c: number): boolean {
  for (const [dr, dc] of piece.cells) {
    const rr = r + dr;
    const cc = c + dc;
    if (rr < 0 || cc < 0 || rr >= KUTAL_N || cc >= KUTAL_N) return false;
    if (board[rr]![cc]) return false;
  }
  return true;
}

export function placeKutal(board: KutalBoard, piece: KutalPiece, r: number, c: number, ink = 1): KutalBoard | null {
  if (!canPlaceKutal(board, piece, r, c)) return null;
  const next = board.map((row) => [...row]);
  for (const [dr, dc] of piece.cells) next[r + dr]![c + dc] = ink;
  return next;
}

export function clearKutalLines(board: KutalBoard): { board: KutalBoard; cleared: number } {
  const rows = board.map((row) => row.every(Boolean));
  const cols = Array.from({ length: KUTAL_N }, (_, c) => board.every((row) => row[c]));
  const cleared = rows.filter(Boolean).length + cols.filter(Boolean).length;
  if (!cleared) return { board, cleared: 0 };
  const next = board.map((row, r) => row.map((v, c) => (rows[r] || cols[c] ? 0 : v)));
  return { board: next, cleared };
}

export function kutalFitsAny(board: KutalBoard, piece: KutalPiece): boolean {
  for (let r = 0; r < KUTAL_N; r++) {
    for (let c = 0; c < KUTAL_N; c++) {
      if (canPlaceKutal(board, piece, r, c)) return true;
    }
  }
  return false;
}

export function kutalDead(board: KutalBoard, hand: (KutalPiece | null)[]): boolean {
  const live = hand.filter((p): p is KutalPiece => p != null);
  if (!live.length) return false;
  return live.every((p) => !kutalFitsAny(board, p));
}

export function dealKutalHand(rand = Math.random): KutalPiece[] {
  return Array.from({ length: 3 }, () => KUTAL_SHAPES[Math.floor(rand() * KUTAL_SHAPES.length)]!);
}

export function kutalPlaceScore(cells: number, cleared: number): number {
  const combo = cleared > 1 ? cleared * 12 : cleared * 8;
  return cells * 2 + combo;
}
