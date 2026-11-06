import { neighbors, pointName } from './coGanhGraph';
import {
  CO_GANH_EMPTY,
  type CoGanhLevel,
  type CoGanhMove,
  type CoGanhState,
} from './coGanh.types';
import { applyMove, getLegalMoves, otherSide, pieceCount, tryMove } from './coGanhEngine';

export interface CoGanhAiParams {
  depth: number;
  noise: number;
  blunderChance: number;
}

export function coGanhLevelLabel(level: CoGanhLevel): string {
  if (level === 'easy') return 'Dễ';
  if (level === 'hard') return 'Khó';
  return 'Vừa';
}

export function aiParamsFor(level: CoGanhLevel): CoGanhAiParams {
  if (level === 'easy') return { depth: 1, noise: 24, blunderChance: 0.28 };
  if (level === 'hard') return { depth: 2, noise: 0, blunderChance: 0 };
  return { depth: 1, noise: 8, blunderChance: 0.08 };
}

export function aiThinkDelayMs(level: CoGanhLevel): number {
  if (level === 'easy') return 360;
  if (level === 'hard') return 640;
  return 480;
}

export function chooseCoGanhMove(state: CoGanhState, params: CoGanhAiParams): CoGanhMove {
  const legal = getLegalMoves(state);
  if (legal.length === 0) throw new Error('Không còn nước đi.');

  const scored = legal.map((move) => {
    const applied = tryMove(state, move.from, move.to);
    if (!applied) return { move, captures: 0, next: state, score: Number.NEGATIVE_INFINITY };
    const captures = applied.ganh.length + applied.vay.length;
    return { move, captures, next: applied.state, score: evaluate(applied.state, state.turn, captures) };
  });

  const winning = scored.find((item) => item.next.status === 'ended' && item.next.winner === state.turn);
  if (winning) return winning.move;

  const capturing = scored.filter((item) => item.captures > 0).sort((a, b) => b.captures - a.captures);
  if (capturing.length > 0 && Math.random() >= params.blunderChance) {
    return capturing[0]!.move;
  }

  const safe = scored.filter((item) => opponentBestCapture(item.next) < 4);
  const pool = (safe.length > 0 ? safe : scored)
    .map((item) => ({
      ...item,
      score: item.score + (params.noise <= 0 ? 0 : randomInt(-params.noise, params.noise)),
    }))
    .sort((left, right) => right.score - left.score);

  if (params.blunderChance > 0 && Math.random() < params.blunderChance) {
    return pool[randomInt(0, Math.min(pool.length, 4) - 1)]!.move;
  }

  if (params.depth <= 1) return pool[0]!.move;

  let best = pool[0]!;
  for (const candidate of pool.slice(0, 12)) {
    const reply = -bestReply(candidate.next);
    const score = candidate.score + reply;
    if (score > best.score) best = { ...candidate, score };
  }
  return best.move;
}

function bestReply(state: CoGanhState): number {
  const legal = getLegalMoves(state);
  let best = Number.NEGATIVE_INFINITY;
  for (const move of legal) {
    const next = applyMove(state, move.from, move.to);
    const captures = next.ganh.length + next.vay.length;
    const score = next.status === 'ended' ? 10_000 : evaluate(next, state.turn, captures);
    if (score > best) best = score;
  }
  return best === Number.NEGATIVE_INFINITY ? 0 : best;
}

function opponentBestCapture(state: CoGanhState): number {
  if (state.status !== 'playing') return 0;
  let best = 0;
  for (const move of getLegalMoves(state)) {
    const applied = tryMove(state, move.from, move.to);
    if (!applied) continue;
    const captures = applied.ganh.length + applied.vay.length;
    if (applied.state.status === 'ended') return 16;
    if (captures > best) best = captures;
  }
  return best;
}

function evaluate(state: CoGanhState, player: CoGanhState['turn'], captures: number): number {
  if (state.status === 'ended') {
    return state.winner === player ? 10_000 : -10_000;
  }
  const mine = pieceCount(state.cells, player);
  const theirs = pieceCount(state.cells, otherSide(player));
  let mobility = 0;
  let center = 0;
  const playerValue = player === 'red' ? 1 : 2;
  state.cells.forEach((cell, index) => {
    if (cell !== playerValue) return;
    mobility += neighbors(index).filter((next) => state.cells[next] === CO_GANH_EMPTY).length;
    if (index === 12) center += 6;
    else if ([6, 7, 8, 11, 13, 16, 17, 18].includes(index)) center += 2;
  });
  return (mine - theirs) * 120 + captures * 80 + mobility * 3 + center;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function describeAiMove(move: CoGanhMove): string {
  return `${pointName(move.from)}-${pointName(move.to)}`;
}
