import { describe, expect, it } from 'vitest';
import {
  BLUE_START,
  CO_GANH_EDGES,
  RED_START,
  areAdjacent,
  colOf,
  hasDiagonals,
  indexOf,
  neighbors,
  parsePoint,
  pointName,
  rowOf,
} from './coGanhGraph';
import {
  CO_GANH_BLUE,
  CO_GANH_EMPTY,
  CO_GANH_POINTS,
  CO_GANH_RED,
  type CoGanhSide,
  type CoGanhState,
} from './coGanh.types';
import {
  applyMove,
  cloneState,
  createInitialState,
  detectGanhs,
  getLegalMoves,
  getWinner,
  pieceCount,
  tryMove,
  validateMove,
} from './coGanhEngine';
import { detectVays, hasLiberty } from './coGanhVay';
import { chooseCoGanhMove } from './coGanhAi';

function emptyBoard(): number[] {
  return Array.from({ length: CO_GANH_POINTS }, () => CO_GANH_EMPTY);
}

function place(side: CoGanhSide, ...points: string[]): number[] {
  const cells = emptyBoard();
  const value = side === 'red' ? CO_GANH_RED : CO_GANH_BLUE;
  for (const name of points) {
    const index = parsePoint(name);
    if (index == null) throw new Error(`Bad point ${name}`);
    cells[index] = value;
  }
  return cells;
}

function merge(base: number[], side: CoGanhSide, ...points: string[]): number[] {
  const cells = base.slice();
  const value = side === 'red' ? CO_GANH_RED : CO_GANH_BLUE;
  for (const name of points) {
    const index = parsePoint(name);
    if (index == null) throw new Error(`Bad point ${name}`);
    cells[index] = value;
  }
  return cells;
}

function stateOf(cells: number[], turn: CoGanhSide = 'red'): CoGanhState {
  return {
    cells,
    turn,
    status: 'playing',
    winner: null,
    lastFrom: null,
    lastTo: null,
    ganh: [],
    vay: [],
    history: [],
  };
}

function must(name: string): number {
  const index = parsePoint(name);
  if (index == null) throw new Error(`Bad point ${name}`);
  return index;
}

describe('Cờ Gánh board graph', () => {
  it('connects every orthogonal neighbor and Alquerque diagonals only', () => {
    expect(CO_GANH_EDGES).toHaveLength(56);
    for (let index = 0; index < CO_GANH_POINTS; index += 1) {
      const row = rowOf(index);
      const col = colOf(index);
      for (const next of neighbors(index)) {
        expect(areAdjacent(index, next)).toBe(true);
        expect(areAdjacent(next, index)).toBe(true);
        const dRow = Math.abs(rowOf(next) - row);
        const dCol = Math.abs(colOf(next) - col);
        expect(dRow <= 1 && dCol <= 1 && dRow + dCol > 0).toBe(true);
        if (dRow === 1 && dCol === 1) {
          expect(hasDiagonals(row, col)).toBe(true);
          expect(hasDiagonals(rowOf(next), colOf(next))).toBe(true);
        }
      }
    }
  });

  it('does not allow diagonal steps from odd-parity points', () => {
    const odd = indexOf(0, 1);
    expect(hasDiagonals(0, 1)).toBe(false);
    expect(neighbors(odd).every((next) => rowOf(next) === 0 || colOf(next) === 1)).toBe(true);
    expect(areAdjacent(odd, indexOf(1, 0))).toBe(false);
    expect(areAdjacent(odd, indexOf(1, 2))).toBe(false);
  });

  it('gives the center eight neighbors and names points like a1–e5', () => {
    expect(neighbors(indexOf(2, 2))).toHaveLength(8);
    expect(pointName(must('a1'))).toBe('a1');
    expect(pointName(must('e5'))).toBe('e5');
    expect(pointName(must('c3'))).toBe('c3');
  });
});

describe('Cờ Gánh initial position', () => {
  it('places eight red and eight blue pieces on the traditional rim', () => {
    const state = createInitialState();
    expect(pieceCount(state.cells, 'red')).toBe(8);
    expect(pieceCount(state.cells, 'blue')).toBe(8);
    expect(state.cells.filter((cell) => cell === CO_GANH_EMPTY)).toHaveLength(9);
    expect(state.turn).toBe('red');
    for (const index of RED_START) expect(state.cells[index]).toBe(CO_GANH_RED);
    for (const index of BLUE_START) expect(state.cells[index]).toBe(CO_GANH_BLUE);
    expect(state.cells[must('a1')]).toBe(CO_GANH_RED);
    expect(state.cells[must('e5')]).toBe(CO_GANH_BLUE);
    expect(state.cells[must('c3')]).toBe(CO_GANH_EMPTY);
  });
});

describe('Cờ Gánh movement', () => {
  it('allows a step along a drawn line onto an empty point', () => {
    const state = createInitialState();
    expect(validateMove(state, must('c1'), must('c2'))).toBe(true);
    const next = applyMove(state, must('c1'), must('c2'));
    expect(next.cells[must('c1')]).toBe(CO_GANH_EMPTY);
    expect(next.cells[must('c2')]).toBe(CO_GANH_RED);
    expect(next.turn).toBe('blue');
  });

  it('rejects occupied destinations, unconnected points, and opponent pieces', () => {
    const state = createInitialState();
    expect(validateMove(state, must('a1'), must('b1'))).toBe(false);
    expect(validateMove(state, must('a1'), must('a3'))).toBe(false);
    expect(validateMove(state, must('a5'), must('a4'))).toBe(false);
    expect(tryMove(state, must('e5'), must('d4'))).toBeNull();
  });

  it('lists only empty adjacent destinations for the side to move', () => {
    const state = createInitialState();
    const fromA1 = getLegalMoves(state, must('a1'));
    expect(fromA1.map((move) => pointName(move.to))).toEqual(['b2']);
    expect(getLegalMoves(state).every((move) => state.cells[move.from] === CO_GANH_RED)).toBe(true);
    expect(getLegalMoves(state, must('a5'))).toEqual([]);
  });
});

describe('Luật Gánh', () => {
  it('converts two opposite enemy pieces on a connected rank', () => {
    const cells = merge(place('blue', 'b3', 'd3'), 'red', 'c2');
    const next = applyMove(stateOf(cells), must('c2'), must('c3'));
    expect(next.cells[must('b3')]).toBe(CO_GANH_RED);
    expect(next.cells[must('d3')]).toBe(CO_GANH_RED);
    expect(next.ganh).toHaveLength(2);
  });

  it('gánh vertically and diagonally only when the lines exist', () => {
    const vertical = applyMove(stateOf(merge(place('blue', 'c4', 'c2'), 'red', 'b3')), must('b3'), must('c3'));
    expect(vertical.ganh).toHaveLength(2);

    const diagonal = applyMove(stateOf(merge(place('blue', 'b4', 'd2'), 'red', 'c2')), must('c2'), must('c3'));
    expect(diagonal.ganh).toHaveLength(2);

    const oddLanding = emptyBoard();
    oddLanding[must('b5')] = CO_GANH_BLUE;
    oddLanding[must('d3')] = CO_GANH_BLUE;
    oddLanding[must('c5')] = CO_GANH_RED;
    expect(detectGanhs(oddLanding, must('c4'), 'red')).toEqual([]);
    const moved = oddLanding.slice();
    moved[must('c4')] = CO_GANH_RED;
    moved[must('c5')] = CO_GANH_EMPTY;
    expect(areAdjacent(must('c4'), must('b5'))).toBe(false);
    expect(areAdjacent(must('c4'), must('d3'))).toBe(false);
    expect(detectGanhs(moved, must('c4'), 'red')).toEqual([]);
  });

  it('handles multiple gánh pairs from one landing (chầu 4)', () => {
    const cells = emptyBoard();
    cells[must('b3')] = CO_GANH_BLUE;
    cells[must('d3')] = CO_GANH_BLUE;
    cells[must('c4')] = CO_GANH_BLUE;
    cells[must('c2')] = CO_GANH_BLUE;
    cells[must('b2')] = CO_GANH_RED;
    const next = applyMove(stateOf(cells), must('b2'), must('c3'));
    expect(next.ganh).toHaveLength(4);
    expect(pieceCount(next.cells, 'red')).toBe(5);
    expect(pieceCount(next.cells, 'blue')).toBe(0);
  });
});

describe('Luật Vây', () => {
  it('does not convert a piece that is only blocked in one direction', () => {
    const cells = merge(place('blue', 'c3'), 'red', 'c4', 'b3');
    expect(hasLiberty(cells, must('c3'))).toBe(true);
    expect(detectVays(cells, 'red')).toEqual([]);
  });

  it('converts a corner piece with no remaining step', () => {
    const cells = emptyBoard();
    cells[must('a5')] = CO_GANH_BLUE;
    cells[must('b5')] = CO_GANH_RED;
    cells[must('a4')] = CO_GANH_RED;
    cells[must('b4')] = CO_GANH_RED;
    expect(detectVays(cells, 'red').sort()).toEqual([must('a5')]);
  });

  it('converts an edge piece whose three neighbors are filled', () => {
    const cells = emptyBoard();
    cells[must('b5')] = CO_GANH_BLUE;
    cells[must('a5')] = CO_GANH_RED;
    cells[must('c5')] = CO_GANH_RED;
    cells[must('b4')] = CO_GANH_RED;
    expect(neighbors(must('b5'))).toHaveLength(3);
    expect(detectVays(cells, 'red')).toEqual([must('b5')]);
  });

  it('converts a connected group that shares no liberty', () => {
    const cells = emptyBoard();
    cells[must('a3')] = CO_GANH_BLUE;
    cells[must('a2')] = CO_GANH_BLUE;
    cells[must('a1')] = CO_GANH_RED;
    cells[must('b1')] = CO_GANH_RED;
    cells[must('b2')] = CO_GANH_RED;
    cells[must('b3')] = CO_GANH_RED;
    cells[must('a4')] = CO_GANH_RED;
    cells[must('b4')] = CO_GANH_RED;
    const captured = detectVays(cells, 'red').sort();
    expect(captured).toEqual([must('a3'), must('a2')].sort());
  });

  it('applies vây immediately after a move fills the last liberty', () => {
    const cells = emptyBoard();
    cells[must('a5')] = CO_GANH_BLUE;
    cells[must('b5')] = CO_GANH_RED;
    cells[must('b4')] = CO_GANH_RED;
    cells[must('a3')] = CO_GANH_RED;
    const next = applyMove(stateOf(cells), must('a3'), must('a4'));
    expect(next.vay).toEqual([must('a5')]);
    expect(next.cells[must('a5')]).toBe(CO_GANH_RED);
  });
});

describe('Turns, ending, and undo', () => {
  it('switches the turn after a quiet move and stops after a win', () => {
    const state = createInitialState();
    const next = applyMove(state, must('c1'), must('c2'));
    expect(next.turn).toBe('blue');
    expect(getWinner(next)).toBeNull();

    const winningCells = merge(place('blue', 'b3', 'd3'), 'red', 'c2');
    for (let i = 0; i < CO_GANH_POINTS; i += 1) {
      if (winningCells[i] === CO_GANH_EMPTY && i !== must('b3') && i !== must('d3') && i !== must('c2') && i !== must('c3')) {
        winningCells[i] = CO_GANH_RED;
      }
    }
    const win = applyMove(stateOf(winningCells), must('c2'), must('c3'));
    expect(win.status).toBe('ended');
    expect(getWinner(win)).toBe('red');
    expect(pieceCount(win.cells, 'blue')).toBe(0);
    expect(getLegalMoves(win)).toEqual([]);
    expect(tryMove(win, must('c3'), must('c4'))).toBeNull();
    expect(() => applyMove(win, must('c3'), must('c4'))).toThrow(/kết thúc/);
  });

  it('does not declare a winner from piece count while the game is still playing', () => {
    const cells = createInitialState().cells.slice();
    cells[must('a5')] = CO_GANH_RED;
    const mid = stateOf(cells);
    expect(pieceCount(mid.cells, 'red')).toBeGreaterThan(pieceCount(mid.cells, 'blue'));
    expect(mid.status).toBe('playing');
    expect(getWinner(mid)).toBeNull();
  });

  it('undo restores a cloned snapshot, including captures', () => {
    const cells = merge(place('blue', 'b3', 'd3'), 'red', 'c2');
    const before = stateOf(cells);
    const snapshot = cloneState(before);
    const after = applyMove(before, must('c2'), must('c3'));
    expect(after.ganh).toHaveLength(2);
    expect(snapshot.cells[must('b3')]).toBe(CO_GANH_BLUE);
    expect(snapshot.turn).toBe('red');
    const redo = applyMove(snapshot, must('c2'), must('c3'));
    expect(redo.cells).toEqual(after.cells);
  });
});

describe('AI', () => {
  it('returns a legal move and prefers a gánh when one is available', () => {
    const start = chooseCoGanhMove(createInitialState(), { depth: 1, noise: 0, blunderChance: 0 });
    expect(validateMove(createInitialState(), start.from, start.to)).toBe(true);

    const cells = merge(place('blue', 'b3', 'd3'), 'red', 'c2');
    const capture = chooseCoGanhMove(stateOf(cells), { depth: 1, noise: 0, blunderChance: 0 });
    expect(capture).toEqual({ from: must('c2'), to: must('c3') });
  });
});
