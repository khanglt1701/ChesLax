import {
  isCheckmate,
  isStalemate,
  isThreefold,
  legalMoves,
  pieceAt,
  pieceValue,
  rankOf,
  crossedRiver,
  tryMove,
  fileOf,
} from './coTuongEngine';
import type { CoTuongLegalMove } from './coTuong.types';
import type { CoTuongLevel, CoTuongState } from './coTuong.types';

export interface CoTuongAiParams {
  depth: number;
  noise: number;
  blunderChance: number;
  maxNodes: number;
  maxTimeMs: number;
}

export function coTuongLevelLabel(level: CoTuongLevel): string {
  if (level === 'easy') return 'Dễ';
  if (level === 'hard') return 'Khó';
  return 'Vừa';
}

export function aiParamsFor(level: CoTuongLevel): CoTuongAiParams {
  if (level === 'easy') return { depth: 1, noise: 80, blunderChance: 0.28, maxNodes: 800, maxTimeMs: 220 };
  if (level === 'hard') return { depth: 3, noise: 0, blunderChance: 0, maxNodes: 8_000, maxTimeMs: 700 };
  return { depth: 2, noise: 18, blunderChance: 0.08, maxNodes: 3_000, maxTimeMs: 400 };
}

export function aiThinkDelayMs(level: CoTuongLevel): number {
  if (level === 'easy') return 280;
  if (level === 'hard') return 520;
  return 380;
}

export function chooseCoTuongMove(state: CoTuongState, params: CoTuongAiParams): CoTuongLegalMove {
  const legal = legalMoves(state);
  if (legal.length === 0) throw new Error('Không còn nước đi hợp lệ.');
  if (params.blunderChance > 0 && Math.random() < params.blunderChance) {
    return legal[Math.floor(Math.random() * legal.length)]!;
  }

  const ctx = {
    nodes: 0,
    maxNodes: Math.max(64, params.maxNodes),
    deadline: Date.now() + Math.min(Math.max(params.maxTimeMs, 50), 1_200),
  };
  const depth = Math.min(Math.max(params.depth, 1), 3);
  let best = legal[0]!;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const move of orderMoves(state, legal)) {
    const applied = tryMove(state, move.from, move.to);
    if (!applied) continue;
    let score = -negamax(applied.state, depth - 1, -30_000, 30_000, ctx);
    if (params.noise > 0) score += randomInt(-params.noise, params.noise);
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}

function negamax(
  state: CoTuongState,
  depth: number,
  alpha: number,
  beta: number,
  ctx: { nodes: number; maxNodes: number; deadline: number },
): number {
  ctx.nodes += 1;
  if (ctx.nodes >= ctx.maxNodes || Date.now() >= ctx.deadline) return evaluate(state);
  if (isCheckmate(state) || isStalemate(state)) return -20_000 + (4 - depth);
  if (isThreefold(state)) return 0;
  if (depth <= 0) return evaluate(state);

  let best = Number.NEGATIVE_INFINITY / 4;
  for (const move of orderMoves(state, legalMoves(state))) {
    const applied = tryMove(state, move.from, move.to);
    if (!applied) continue;
    const score = -negamax(applied.state, depth - 1, -beta, -alpha, ctx);
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

function orderMoves(state: CoTuongState, moves: CoTuongLegalMove[]): CoTuongLegalMove[] {
  return [...moves].sort((left, right) => pieceValue(pieceAt(state.squares, right.to)) - pieceValue(pieceAt(state.squares, left.to)));
}

function evaluate(state: CoTuongState): number {
  let score = 0;
  for (let index = 0; index < state.squares.length; index += 1) {
    const piece = state.squares[index] === '.' ? '' : (state.squares[index] ?? '');
    if (!piece) continue;
    const red = piece === piece.toUpperCase();
    let value = pieceValue(piece);
    if (piece.toLowerCase() === 'p' && crossedRiver(rankOf(index), red ? 'r' : 'b')) value += 40;
    if (piece.toLowerCase() === 'n') {
      const file = fileOf(index);
      value += 8 - Math.abs(file - 4) * 2;
    }
    score += red ? value : -value;
  }
  return state.turn === 'r' ? score : -score;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

