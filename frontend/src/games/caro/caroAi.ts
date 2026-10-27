import { legalMoves, markValue, otherMark, place, wouldWin, type CaroState } from './caroEngine';

const SHAPE_SCORE = [0, 2, 18, 120, 900, 100_000];

export interface CaroAiParams {
  depth: number;
  noise: number;
  blunderChance: number;
}

export function chooseCaroMove(state: CaroState, params: CaroAiParams): number {
  const player = markValue(state.turn);
  const legal = legalMoves(state);
  if (legal.length === 0) throw new Error('Không còn ô trống.');
  const winning = legal.find((index) => wouldWin(state.cells, index, player, state.size));
  if (winning !== undefined) return winning;

  const opponent = markValue(otherMark(state.turn));
  const blocks = legal.filter((index) => wouldWin(state.cells, index, opponent, state.size));
  if (blocks.length > 0 && Math.random() >= params.blunderChance) return blocks[0]!;

  const ranked = legal
    .map((index) => ({
      index,
      score: staticScore(state.cells, state.size, index, player) + (params.noise <= 0 ? 0 : randomInt(-params.noise, params.noise)),
    }))
    .sort((left, right) => right.score - left.score);
  const pool = params.depth <= 1 ? ranked : ranked.slice(0, 10);
  if (params.blunderChance > 0 && Math.random() < params.blunderChance) {
    return pool[randomInt(0, pool.length - 1)]!.index;
  }
  if (params.depth <= 1) return pool[0]!.index;

  let bestIndex = pool[0]!.index;
  let best = Number.NEGATIVE_INFINITY;
  for (const candidate of pool) {
    const next = place(state, candidate.index, state.turn);
    const score = next.status === 'ended' ? (next.winner === state.turn ? 100_000 : 0) : -bestReply(next, opponent);
    if (score > best) {
      best = score;
      bestIndex = candidate.index;
    }
  }
  return bestIndex;
}

function bestReply(state: CaroState, player: number): number {
  const legal = legalMoves(state)
    .map((index) => ({ index, score: staticScore(state.cells, state.size, index, player) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 8);
  let best = Number.NEGATIVE_INFINITY;
  for (const candidate of legal) {
    if (wouldWin(state.cells, candidate.index, player, state.size)) return 90_000;
    const next = place(state, candidate.index);
    const score = next.status === 'ended' ? 0 : evaluate(next.cells, next.size, player);
    if (score > best) best = score;
  }
  return best === Number.NEGATIVE_INFINITY ? 0 : best;
}

function staticScore(cells: number[], size: number, index: number, player: number): number {
  const next = cells.slice();
  next[index] = player;
  return evaluate(next, size, player);
}

function evaluate(cells: number[], size: number, player: number): number {
  const opponent = player === 1 ? 2 : 1;
  return scan(cells, size, player) - scan(cells, size, opponent);
}

function scan(cells: number[], size: number, player: number): number {
  let total = 0;
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column <= size - 5; column += 1) total += windowScore(cells, size, row, column, 0, 1, player);
  }
  for (let column = 0; column < size; column += 1) {
    for (let row = 0; row <= size - 5; row += 1) total += windowScore(cells, size, row, column, 1, 0, player);
  }
  for (let row = 0; row <= size - 5; row += 1) {
    for (let column = 0; column <= size - 5; column += 1) total += windowScore(cells, size, row, column, 1, 1, player);
  }
  for (let row = 0; row <= size - 5; row += 1) {
    for (let column = 4; column < size; column += 1) total += windowScore(cells, size, row, column, 1, -1, player);
  }
  return total;
}

function windowScore(
  cells: number[],
  size: number,
  row: number,
  column: number,
  dRow: number,
  dColumn: number,
  player: number,
): number {
  let mine = 0;
  let other = 0;
  for (let step = 0; step < 5; step += 1) {
    const value = cells[(row + dRow * step) * size + (column + dColumn * step)] ?? 0;
    if (value === player) mine += 1;
    else if (value !== 0) other += 1;
  }
  if (other > 0 || mine === 0) return 0;
  if (mine === 5 && bothEndsBlocked(cells, size, row, column, dRow, dColumn, player)) return 40;
  return SHAPE_SCORE[mine] ?? 0;
}

function bothEndsBlocked(
  cells: number[],
  size: number,
  row: number,
  column: number,
  dRow: number,
  dColumn: number,
  player: number,
): boolean {
  return endBlocked(cells, size, row - dRow, column - dColumn, player)
    && endBlocked(cells, size, row + dRow * 5, column + dColumn * 5, player);
}

function endBlocked(cells: number[], size: number, row: number, column: number, player: number): boolean {
  if (row < 0 || column < 0 || row >= size || column >= size) return true;
  const value = cells[row * size + column] ?? 0;
  return value !== 0 && value !== player;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function aiParamsFor(level: 'easy' | 'medium' | 'hard'): CaroAiParams {
  if (level === 'easy') return { depth: 1, noise: 80, blunderChance: 0.35 };
  if (level === 'hard') return { depth: 2, noise: 0, blunderChance: 0 };
  return { depth: 1, noise: 20, blunderChance: 0.08 };
}

export const CARO_AI_RATINGS: Record<'easy' | 'medium' | 'hard', number> = {
  easy: 800,
  medium: 1200,
  hard: 1800,
};

export function caroLevelLabel(level: 'easy' | 'medium' | 'hard'): string {
  if (level === 'easy') return 'Dễ';
  if (level === 'hard') return 'Khó';
  return 'Vừa';
}
