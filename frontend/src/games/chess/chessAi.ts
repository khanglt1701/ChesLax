import { Chess, type Color, type Move, type PieceSymbol } from 'chess.js';
import { applyMove } from './chessService';
import type { AppliedMove, ChessAiLevel } from './chess.types';

const PIECE_VALUE: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

const MATE_SCORE = 100_000;

const PAWN_PST = [
  0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, -20, -20, 10, 10, 5, 5, -5, -10, 0, 0, -10, -5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, 5,
  10, 25, 25, 10, 5, 5, 10, 10, 20, 30, 30, 20, 10, 10, 50, 50, 50, 50, 50, 50, 50, 50, 0, 0, 0, 0, 0, 0, 0, 0,
];

const KNIGHT_PST = [
  -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 5, 5, 0, -20, -40, -30, 5, 10, 15, 15, 10, 5, -30, -30, 0, 15, 20,
  20, 15, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 10, 15, 15, 10, 0, -30, -40, -20, 0, 0, 0, 0, -20, -40, -50,
  -40, -30, -30, -30, -30, -40, -50,
];

const BISHOP_PST = [
  -20, -10, -10, -10, -10, -10, -10, -20, -10, 5, 0, 0, 0, 0, 5, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 0, 10, 10,
  10, 10, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 0, 0, 0, 0, 0, 0, -10, -20, -10, -10,
  -10, -10, -10, -10, -20,
];

const ROOK_PST = [
  0, 0, 5, 10, 10, 5, 0, 0, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0,
  0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 5, 10, 10, 10, 10, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
];

const QUEEN_PST = [
  -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 5, 0, 0, 0, 0, -10, -10, 5, 5, 5, 5, 5, 0, -10, 0, 0, 5, 5, 5, 5, 0, -5,
  -5, 0, 5, 5, 5, 5, 0, -5, -10, 0, 5, 5, 5, 5, 0, -10, -10, 0, 0, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20,
];

const KING_MID_PST = [
  20, 30, 10, 0, 0, 10, 30, 20, 20, 20, 0, 0, 0, 0, 20, 20, -10, -20, -20, -20, -20, -20, -20, -10, -20, -30, -30, -40,
  -40, -30, -30, -20, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50,
  -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30,
];

const KING_END_PST = [
  -50, -30, -30, -30, -30, -30, -30, -50, -30, -10, 0, 0, 0, 0, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10,
  30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0,
  -30, -30, -50, -30, -30, -30, -30, -30, -30, -50,
];

const PST: Record<Exclude<PieceSymbol, 'k'>, number[]> = {
  p: PAWN_PST,
  n: KNIGHT_PST,
  b: BISHOP_PST,
  r: ROOK_PST,
  q: QUEEN_PST,
};

export const AI_LEVELS: {
  id: ChessAiLevel;
  label: string;
  description: string;
}[] = [
  { id: 'easy', label: 'Dễ', description: 'Máy hay sai, phù hợp làm quen luật và bắt quân.' },
  { id: 'medium', label: 'Vừa', description: 'Có tính nước cơ bản, đủ sức cản người chơi.' },
  { id: 'hard', label: 'Khó', description: 'Tính nhiều nước hơn, ít bỏ quân và biết chiếu hết.' },
];

interface LevelConfig {
  depth: number;
  noise: number;
  blunderChance: number;
  maxNodes: number;
  maxTimeMs: number;
  delayMs: number;
  useBook: boolean;
  quiesce: boolean;
}

const LEVEL_CONFIG: Record<ChessAiLevel, LevelConfig> = {
  easy: {
    depth: 1,
    noise: 320,
    blunderChance: 0.24,
    maxNodes: 3_000,
    maxTimeMs: 350,
    delayMs: 340,
    useBook: false,
    quiesce: false,
  },
  medium: {
    depth: 2,
    noise: 70,
    blunderChance: 0.05,
    maxNodes: 12_000,
    maxTimeMs: 700,
    delayMs: 420,
    useBook: true,
    quiesce: false,
  },
  hard: {
    depth: 3,
    noise: 0,
    blunderChance: 0,
    maxNodes: 40_000,
    maxTimeMs: 1_200,
    delayMs: 80,
    useBook: true,
    quiesce: true,
  },
};

interface SearchContext {
  nodes: number;
  maxNodes: number;
  start: number;
  maxTimeMs: number;
  quiesce: boolean;
}

const BOOK: Record<string, string[]> = {};

function bookKey(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ');
}

function addBookLine(sans: string[]): void {
  const chess = new Chess();
  for (const san of sans) {
    const key = bookKey(chess.fen());
    const existing = BOOK[key] ?? [];
    if (!existing.includes(san)) existing.push(san);
    BOOK[key] = existing;
    chess.move(san);
  }
}

addBookLine(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5']);
addBookLine(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6']);
addBookLine(['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4']);
addBookLine(['e4', 'e6', 'd4', 'd5']);
addBookLine(['e4', 'c6', 'd4', 'd5']);
addBookLine(['d4', 'd5', 'c4', 'e6']);
addBookLine(['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7']);
addBookLine(['Nf3', 'd5', 'd4', 'Nf6']);
addBookLine(['c4', 'e5']);

export function aiLevelLabel(level: ChessAiLevel): string {
  return AI_LEVELS.find((item) => item.id === level)?.label ?? 'Vừa';
}

export function aiThinkDelayMs(level: ChessAiLevel): number {
  return LEVEL_CONFIG[level].delayMs;
}

export function evaluateFen(fen: string): number {
  return evaluateBoard(new Chess(fen));
}

function pstIndex(color: Color, rankIndex: number, fileIndex: number): number {
  return color === 'w' ? (7 - rankIndex) * 8 + fileIndex : rankIndex * 8 + fileIndex;
}

function evaluateBoard(chess: Chess): number {
  const board = chess.board();
  let score = 0;
  let material = 0;
  let whiteBishops = 0;
  let blackBishops = 0;

  for (let rankIndex = 0; rankIndex < 8; rankIndex += 1) {
    const row = board[rankIndex];
    if (!row) continue;
    for (let fileIndex = 0; fileIndex < 8; fileIndex += 1) {
      const square = row[fileIndex];
      if (!square) continue;
      const sign = square.color === 'w' ? 1 : -1;
      const value = PIECE_VALUE[square.type];
      material += value;
      score += sign * value;
      const index = pstIndex(square.color, rankIndex, fileIndex);
      if (square.type === 'k') continue;
      const table = PST[square.type];
      score += sign * (table[index] ?? 0);
      if (square.type === 'b') {
        if (square.color === 'w') whiteBishops += 1;
        else blackBishops += 1;
      }
    }
  }

  const endgame = material < 1800;
  for (let rankIndex = 0; rankIndex < 8; rankIndex += 1) {
    const row = board[rankIndex];
    if (!row) continue;
    for (let fileIndex = 0; fileIndex < 8; fileIndex += 1) {
      const square = row[fileIndex];
      if (!square || square.type !== 'k') continue;
      const sign = square.color === 'w' ? 1 : -1;
      const table = endgame ? KING_END_PST : KING_MID_PST;
      score += sign * (table[pstIndex(square.color, rankIndex, fileIndex)] ?? 0);
    }
  }

  if (whiteBishops >= 2) score += 30;
  if (blackBishops >= 2) score -= 30;
  return score;
}

function evaluateForSideToMove(chess: Chess): number {
  const whiteScore = evaluateBoard(chess);
  return chess.turn() === 'w' ? whiteScore : -whiteScore;
}

function isTimedOut(ctx: SearchContext): boolean {
  return ctx.nodes >= ctx.maxNodes || performance.now() - ctx.start >= ctx.maxTimeMs;
}

function moveOrderScore(move: Move): number {
  let score = 0;
  if (move.captured) {
    score += 10 * PIECE_VALUE[move.captured] - PIECE_VALUE[move.piece];
  }
  if (move.promotion) {
    score += PIECE_VALUE[move.promotion];
  }
  if (move.flags.includes('c')) score += 15;
  return score;
}

function orderedMoves(chess: Chess, capturesOnly = false): Move[] {
  const moves = chess.moves({ verbose: true }).filter((move) => {
    if (!capturesOnly) return true;
    return Boolean(move.captured || move.promotion);
  });
  moves.sort((a, b) => moveOrderScore(b) - moveOrderScore(a));
  return moves;
}

function quiesce(chess: Chess, alpha: number, beta: number, qDepth: number, ctx: SearchContext): number {
  ctx.nodes += 1;
  if (chess.isCheckmate()) return -MATE_SCORE;
  if (chess.isDraw()) return 0;

  const standPat = evaluateForSideToMove(chess);
  if (qDepth <= 0 || isTimedOut(ctx)) return standPat;
  if (standPat >= beta) return beta;
  let localAlpha = Math.max(alpha, standPat);

  for (const move of orderedMoves(chess, true)) {
    chess.move(move);
    const score = -quiesce(chess, -beta, -localAlpha, qDepth - 1, ctx);
    chess.undo();
    if (score >= beta) return beta;
    if (score > localAlpha) localAlpha = score;
    if (isTimedOut(ctx)) break;
  }
  return localAlpha;
}

function negamax(chess: Chess, depth: number, alpha: number, beta: number, ply: number, ctx: SearchContext): number {
  ctx.nodes += 1;
  if (chess.isCheckmate()) return -MATE_SCORE + ply;
  if (chess.isDraw()) return 0;
  if (isTimedOut(ctx)) return evaluateForSideToMove(chess);
  if (depth <= 0) {
    return ctx.quiesce ? quiesce(chess, alpha, beta, 4, ctx) : evaluateForSideToMove(chess);
  }

  let localAlpha = alpha;
  let best = -Infinity;
  const moves = orderedMoves(chess);
  if (moves.length === 0) return evaluateForSideToMove(chess);

  for (const move of moves) {
    chess.move(move);
    const score = -negamax(chess, depth - 1, -beta, -localAlpha, ply + 1, ctx);
    chess.undo();
    if (score > best) best = score;
    if (score > localAlpha) localAlpha = score;
    if (localAlpha >= beta) break;
    if (isTimedOut(ctx)) break;
  }
  return best;
}

function pickBookMove(chess: Chess, rng: () => number): Move | null {
  const options = BOOK[bookKey(chess.fen())];
  if (!options?.length) return null;
  const san = options[Math.floor(rng() * options.length)] ?? options[0];
  if (!san) return null;
  return chess.moves({ verbose: true }).find((move) => move.san === san) ?? null;
}

function pickFromScored(
  scored: { move: Move; score: number }[],
  blunderChance: number,
  rng: () => number,
): Move {
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const best = sorted[0]?.move;
  if (!best) throw new Error('Không còn nước đi.');
  if (sorted.length === 1 || rng() >= blunderChance) return best;

  const start = Math.max(1, Math.floor(sorted.length * 0.45));
  const pool = sorted.slice(start);
  const choice = pool[Math.floor(rng() * pool.length)] ?? sorted[sorted.length - 1];
  return choice?.move ?? best;
}

export function chooseAiMove(
  fen: string,
  level: ChessAiLevel,
  rng: () => number = Math.random,
): AppliedMove | null {
  const chess = new Chess(fen);
  if (chess.isGameOver()) return null;

  const config = LEVEL_CONFIG[level];
  if (config.useBook) {
    const booked = pickBookMove(chess, rng);
    if (booked) {
      return applyMove(fen, booked.from, booked.to, booked.promotion);
    }
  }

  const moves = orderedMoves(chess);
  if (moves.length === 0) return null;

  const ctx: SearchContext = {
    nodes: 0,
    maxNodes: config.maxNodes,
    start: performance.now(),
    maxTimeMs: config.maxTimeMs,
    quiesce: config.quiesce,
  };

  const scored = moves.map((move) => {
    chess.move(move);
    const searchScore = -negamax(chess, config.depth - 1, -Infinity, Infinity, 1, ctx);
    const noise = config.noise > 0 ? (rng() * 2 - 1) * config.noise : 0;
    chess.undo();
    return { move, score: searchScore + noise };
  });

  const chosen = pickFromScored(scored, config.blunderChance, rng);
  return applyMove(fen, chosen.from, chosen.to, chosen.promotion);
}
