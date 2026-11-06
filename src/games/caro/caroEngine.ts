export const CARO_BOARD_SIZE = 12;
export const CARO_WIN_LENGTH = 5;
export const CARO_SIZE = CARO_BOARD_SIZE;
export const CARO_WIN = CARO_WIN_LENGTH;

export type CaroMark = 'x' | 'o';
export type CaroWinner = CaroMark | 'draw' | null;

export interface CaroState {
  size: number;
  cells: number[];
  turn: CaroMark;
  status: 'playing' | 'ended';
  winner: CaroWinner;
  lastIndex: number | null;
  winningLine: number[];
}

export const CARO_X = 1;
export const CARO_O = 2;

export function markValue(mark: CaroMark): number {
  return mark === 'x' ? CARO_X : CARO_O;
}

export function valueMark(value: number): CaroMark | null {
  if (value === CARO_X) return 'x';
  if (value === CARO_O) return 'o';
  return null;
}

export function otherMark(mark: CaroMark): CaroMark {
  return mark === 'x' ? 'o' : 'x';
}

export function resolveBoardSize(cells: number[], size?: number): number {
  if (size && size * size === cells.length) return size;
  const root = Math.round(Math.sqrt(cells.length));
  if (root * root === cells.length && root >= 5) return root;
  return CARO_BOARD_SIZE;
}

export function createInitialState(size = CARO_BOARD_SIZE): CaroState {
  return {
    size,
    cells: Array.from({ length: size * size }, () => 0),
    turn: 'x',
    status: 'playing',
    winner: null,
    lastIndex: null,
    winningLine: [],
  };
}

export function coordinate(index: number, size = CARO_BOARD_SIZE): string {
  const column = index % size;
  const row = Math.floor(index / size);
  return `${String.fromCharCode(97 + column)}${size - row}`;
}

export function describeMove(mark: CaroMark, index: number, size = CARO_BOARD_SIZE): string {
  return `${mark === 'x' ? 'X' : 'O'} ${coordinate(index, size)}`;
}

export function resultLabel(state: CaroState): string {
  if (state.winner === 'draw') return 'Hòa — bàn đã kín';
  if (state.winner === 'x') return 'X thắng';
  if (state.winner === 'o') return 'O thắng';
  return `Lượt ${state.turn === 'x' ? 'X' : 'O'}`;
}

export function winningLine(cells: number[], index: number, player: number, size = resolveBoardSize(cells)): number[] {
  if (size < 5 || index < 0 || index >= size * size) return [];
  const row = Math.floor(index / size);
  const column = index % size;
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ] as const;
  const wins: number[] = [];
  const seen = new Set<number>();
  for (const [dRow, dColumn] of directions) {
    const run = winningRun(cells, size, row, column, dRow, dColumn, player);
    if (!run) continue;
    for (const cell of run) {
      if (!seen.has(cell)) {
        seen.add(cell);
        wins.push(cell);
      }
    }
  }
  return wins;
}

function winningRun(
  cells: number[],
  size: number,
  row: number,
  column: number,
  dRow: number,
  dColumn: number,
  player: number,
): number[] | null {
  let startRow = row;
  let startColumn = column;
  while (true) {
    const previousRow = startRow - dRow;
    const previousColumn = startColumn - dColumn;
    if (!inside(previousRow, previousColumn, size) || cells[previousRow * size + previousColumn] !== player) break;
    startRow = previousRow;
    startColumn = previousColumn;
  }

  const run: number[] = [];
  let endRow = startRow;
  let endColumn = startColumn;
  while (inside(endRow, endColumn, size) && cells[endRow * size + endColumn] === player) {
    run.push(endRow * size + endColumn);
    endRow += dRow;
    endColumn += dColumn;
  }

  if (run.length < CARO_WIN_LENGTH) return null;
  const startBlocked = isBlocked(cells, size, startRow - dRow, startColumn - dColumn, player);
  const endBlocked = isBlocked(cells, size, endRow, endColumn, player);
  return startBlocked && endBlocked ? null : run;
}

function isBlocked(cells: number[], size: number, row: number, column: number, player: number): boolean {
  if (!inside(row, column, size)) return true;
  const value = cells[row * size + column] ?? 0;
  return value !== 0 && value !== player;
}

function inside(row: number, column: number, size: number): boolean {
  return row >= 0 && column >= 0 && row < size && column < size;
}

export function place(state: CaroState, index: number, mark: CaroMark = state.turn): CaroState {
  const size = state.size;
  if (state.status !== 'playing') throw new Error('Ván đã kết thúc.');
  if (mark !== state.turn) throw new Error('Không phải lượt của bạn.');
  if (index < 0 || index >= state.cells.length || state.cells[index] !== 0) {
    throw new Error('Ô này không đặt được.');
  }
  const player = markValue(mark);
  const cells = state.cells.slice();
  cells[index] = player;
  const line = winningLine(cells, index, player, size);
  if (line.length > 0) {
    return {
      size,
      cells,
      turn: mark,
      status: 'ended',
      winner: mark,
      lastIndex: index,
      winningLine: line,
    };
  }
  if (cells.every((cell) => cell !== 0)) {
    return {
      size,
      cells,
      turn: mark,
      status: 'ended',
      winner: 'draw',
      lastIndex: index,
      winningLine: [],
    };
  }
  return {
    size,
    cells,
    turn: otherMark(mark),
    status: 'playing',
    winner: null,
    lastIndex: index,
    winningLine: [],
  };
}

export function wouldWin(cells: number[], index: number, player: number, size = resolveBoardSize(cells)): boolean {
  if (index < 0 || index >= cells.length || cells[index] !== 0) return false;
  const next = cells.slice();
  next[index] = player;
  return winningLine(next, index, player, size).length > 0;
}

export function legalMoves(state: CaroState): number[] {
  if (state.status !== 'playing') return [];
  const size = state.size;
  const occupied: Array<[number, number]> = [];
  state.cells.forEach((cell, index) => {
    if (cell !== 0) occupied.push([Math.floor(index / size), index % size]);
  });
  if (occupied.length === 0) {
    const mid = Math.floor(size / 2);
    return [mid * size + mid];
  }
  const moves: number[] = [];
  state.cells.forEach((cell, index) => {
    if (cell !== 0) return;
    const row = Math.floor(index / size);
    const column = index % size;
    if (occupied.some(([stoneRow, stoneColumn]) => Math.max(Math.abs(stoneRow - row), Math.abs(stoneColumn - column)) <= 2)) {
      moves.push(index);
    }
  });
  return moves;
}
