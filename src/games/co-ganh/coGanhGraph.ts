import { CO_GANH_POINTS, CO_GANH_SIZE } from './coGanh.types';

const ORTHO: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];

const DIAG: ReadonlyArray<readonly [number, number]> = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/** Opposite neighbor pairs used by luật Gánh. */
export const GANH_AXES: ReadonlyArray<readonly [readonly [number, number], readonly [number, number]]> = [
  [
    [0, 1],
    [0, -1],
  ],
  [
    [1, 0],
    [-1, 0],
  ],
  [
    [1, 1],
    [-1, -1],
  ],
  [
    [1, -1],
    [-1, 1],
  ],
];

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && col >= 0 && row < CO_GANH_SIZE && col < CO_GANH_SIZE;
}

export function indexOf(row: number, col: number): number {
  return row * CO_GANH_SIZE + col;
}

export function rowOf(index: number): number {
  return Math.floor(index / CO_GANH_SIZE);
}

export function colOf(index: number): number {
  return index % CO_GANH_SIZE;
}

/** Alquerque / Cờ Gánh: only even-parity points have diagonal lines. */
export function hasDiagonals(row: number, col: number): boolean {
  return (row + col) % 2 === 0;
}

function buildNeighbors(): number[][] {
  return Array.from({ length: CO_GANH_POINTS }, (_, index) => {
    const row = rowOf(index);
    const col = colOf(index);
    const next: number[] = [];
    for (const [dRow, dCol] of ORTHO) {
      const rowTo = row + dRow;
      const colTo = col + dCol;
      if (inBounds(rowTo, colTo)) next.push(indexOf(rowTo, colTo));
    }
    if (hasDiagonals(row, col)) {
      for (const [dRow, dCol] of DIAG) {
        const rowTo = row + dRow;
        const colTo = col + dCol;
        if (inBounds(rowTo, colTo)) next.push(indexOf(rowTo, colTo));
      }
    }
    return next;
  });
}

const NEIGHBORS = buildNeighbors();

export function neighbors(index: number): readonly number[] {
  return NEIGHBORS[index] ?? [];
}

export function areAdjacent(from: number, to: number): boolean {
  return (NEIGHBORS[from] ?? []).includes(to);
}

export function neighborInDirection(from: number, dRow: number, dCol: number): number | null {
  const row = rowOf(from) + dRow;
  const col = colOf(from) + dCol;
  if (!inBounds(row, col)) return null;
  const index = indexOf(row, col);
  return areAdjacent(from, index) ? index : null;
}

export const CO_GANH_EDGES: ReadonlyArray<readonly [number, number]> = (() => {
  const edges: Array<readonly [number, number]> = [];
  for (let from = 0; from < CO_GANH_POINTS; from += 1) {
    for (const to of neighbors(from)) {
      if (from < to) edges.push([from, to]);
    }
  }
  return edges;
})();

export function pointName(index: number): string {
  const col = colOf(index);
  const row = rowOf(index);
  return `${String.fromCharCode(97 + col)}${CO_GANH_SIZE - row}`;
}

export function parsePoint(name: string): number | null {
  const match = /^([a-e])([1-5])$/i.exec(name.trim());
  if (!match) return null;
  const col = match[1]!.toLowerCase().charCodeAt(0) - 97;
  const rank = Number(match[2]);
  const row = CO_GANH_SIZE - rank;
  if (!inBounds(row, col)) return null;
  return indexOf(row, col);
}

/**
 * Traditional starting points, 180° rotationally symmetric, all on the rim.
 * Red (first) sits on rank 1; Blue sits on rank 5.
 */
export const RED_START: readonly number[] = [
  indexOf(4, 0),
  indexOf(4, 1),
  indexOf(4, 2),
  indexOf(4, 3),
  indexOf(4, 4),
  indexOf(3, 0),
  indexOf(3, 4),
  indexOf(2, 0),
];

export const BLUE_START: readonly number[] = [
  indexOf(0, 0),
  indexOf(0, 1),
  indexOf(0, 2),
  indexOf(0, 3),
  indexOf(0, 4),
  indexOf(1, 0),
  indexOf(1, 4),
  indexOf(2, 4),
];
