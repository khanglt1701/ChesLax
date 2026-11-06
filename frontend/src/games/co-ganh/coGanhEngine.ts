import { BLUE_START, GANH_AXES, RED_START, areAdjacent, neighborInDirection, neighbors, pointName } from './coGanhGraph';
import {
  CO_GANH_BLUE,
  CO_GANH_EMPTY,
  CO_GANH_POINTS,
  CO_GANH_RED,
  type CoGanhMove,
  type CoGanhMoveResult,
  type CoGanhSide,
  type CoGanhState,
} from './coGanh.types';
import { detectVays } from './coGanhVay';

export function sideValue(side: CoGanhSide): number {
  return side === 'red' ? CO_GANH_RED : CO_GANH_BLUE;
}

export function valueSide(value: number): CoGanhSide | null {
  if (value === CO_GANH_RED) return 'red';
  if (value === CO_GANH_BLUE) return 'blue';
  return null;
}

export function otherSide(side: CoGanhSide): CoGanhSide {
  return side === 'red' ? 'blue' : 'red';
}

export function sideLabel(side: CoGanhSide): string {
  return side === 'red' ? 'Đỏ' : 'Xanh';
}

export function cloneState(state: CoGanhState): CoGanhState {
  return {
    cells: state.cells.slice(),
    turn: state.turn,
    status: state.status,
    winner: state.winner,
    lastFrom: state.lastFrom,
    lastTo: state.lastTo,
    ganh: state.ganh.slice(),
    vay: state.vay.slice(),
    history: state.history.slice(),
  };
}

export function createInitialState(): CoGanhState {
  const cells = Array.from({ length: CO_GANH_POINTS }, () => CO_GANH_EMPTY);
  for (const index of RED_START) cells[index] = CO_GANH_RED;
  for (const index of BLUE_START) cells[index] = CO_GANH_BLUE;
  return {
    cells,
    turn: 'red',
    status: 'playing',
    winner: null,
    lastFrom: null,
    lastTo: null,
    ganh: [],
    vay: [],
    history: [],
  };
}

export function pieceCount(cells: number[], side: CoGanhSide): number {
  const value = sideValue(side);
  return cells.reduce((total, cell) => total + (cell === value ? 1 : 0), 0);
}

export function detectGanhs(cells: number[], landing: number, player: CoGanhSide): number[] {
  const opponent = sideValue(otherSide(player));
  const captured: number[] = [];
  for (const [forward, backward] of GANH_AXES) {
    const left = neighborInDirection(landing, forward[0], forward[1]);
    const right = neighborInDirection(landing, backward[0], backward[1]);
    if (left == null || right == null) continue;
    if (cells[left] === opponent && cells[right] === opponent) {
      captured.push(left, right);
    }
  }
  return captured;
}

export function getLegalMoves(state: CoGanhState, from?: number): CoGanhMove[] {
  if (state.status !== 'playing') return [];
  const player = sideValue(state.turn);
  if (from !== undefined) {
    if (state.cells[from] !== player) return [];
    return neighbors(from)
      .filter((to) => state.cells[to] === CO_GANH_EMPTY)
      .map((to) => ({ from, to }));
  }
  const moves: CoGanhMove[] = [];
  state.cells.forEach((cell, index) => {
    if (cell !== player) return;
    for (const to of neighbors(index)) {
      if (state.cells[to] === CO_GANH_EMPTY) moves.push({ from: index, to });
    }
  });
  return moves;
}

export function validateMove(state: CoGanhState, from: number, to: number): boolean {
  return illegalReason(state, from, to) == null;
}

function illegalReason(state: CoGanhState, from: number, to: number): string | null {
  if (state.status !== 'playing') return 'Ván đã kết thúc.';
  if (from < 0 || from >= CO_GANH_POINTS || to < 0 || to >= CO_GANH_POINTS) return 'Giao điểm không tồn tại.';
  if (state.cells[from] !== sideValue(state.turn)) return 'Không phải quân của bạn.';
  if (state.cells[to] !== CO_GANH_EMPTY) return 'Giao điểm này đã có quân.';
  if (!areAdjacent(from, to)) return 'Hai giao điểm không nối trực tiếp.';
  return null;
}

export function applyMove(state: CoGanhState, from: number, to: number): CoGanhState {
  const applied = tryMove(state, from, to);
  if (!applied) {
    throw new Error(illegalReason(state, from, to) ?? 'Nước đi không hợp lệ.');
  }
  return applied.state;
}

export function tryMove(state: CoGanhState, from: number, to: number): CoGanhMoveResult | null {
  const reason = illegalReason(state, from, to);
  if (reason) return null;

  const player = state.turn;
  const cells = state.cells.slice();
  cells[to] = cells[from]!;
  cells[from] = CO_GANH_EMPTY;

  const ganh = unique(detectGanhs(cells, to, player));
  for (const index of ganh) cells[index] = sideValue(player);

  const vay = unique(detectVays(cells, player));
  for (const index of vay) cells[index] = sideValue(player);

  const opponent = otherSide(player);
  const opponentLeft = pieceCount(cells, opponent);
  const ended = opponentLeft === 0;
  const notation = describeMove(player, from, to, ganh.length, vay.length);
  const next: CoGanhState = {
    cells,
    turn: ended ? player : opponent,
    status: ended ? 'ended' : 'playing',
    winner: ended ? player : null,
    lastFrom: from,
    lastTo: to,
    ganh,
    vay,
    history: [...state.history, notation],
  };
  return { state: next, from, to, ganh, vay, notation };
}

export function getWinner(state: CoGanhState): CoGanhSide | null {
  if (state.status !== 'ended') return null;
  return state.winner;
}

export function resultLabel(state: CoGanhState): string {
  if (state.status === 'ended' && state.winner) {
    return `${sideLabel(state.winner)} thắng — chiếm toàn bộ quân đối phương`;
  }
  return `Lượt ${sideLabel(state.turn)} · Đỏ ${pieceCount(state.cells, 'red')} — Xanh ${pieceCount(state.cells, 'blue')}`;
}

export function describeMove(side: CoGanhSide, from: number, to: number, ganhCount: number, vayCount: number): string {
  const tags: string[] = [];
  if (ganhCount > 0) tags.push(`Gánh ${ganhCount}`);
  if (vayCount > 0) tags.push(`Vây ${vayCount}`);
  const extra = tags.length ? ` (${tags.join(', ')})` : '';
  return `${sideLabel(side)} ${pointName(from)}-${pointName(to)}${extra}`;
}

function unique(values: number[]): number[] {
  return [...new Set(values)];
}
