import { Chess, type Square } from 'chess.js';
import { createInitialState as createCaro, place, resultLabel as caroResult, type CaroState } from '@/games/caro/caroEngine';
import {
  createInitialState as createCoGanh,
  resultLabel as coGanhResult,
  tryMove as tryCoGanhMove,
} from '@/games/co-ganh/coGanhEngine';
import type { CoGanhState } from '@/games/co-ganh/coGanh.types';
import {
  createInitialState as createCoTuong,
  isGameOver,
  resultLabel as coTuongResult,
  tryMove as tryCoTuongMove,
} from '@/games/co-tuong/coTuongEngine';
import type { CoTuongState } from '@/games/co-tuong/coTuong.types';
import { applyMove as applyOAnQuan, createInitialState as createOAnQuan, resultLabel as oAnQuanResult } from '@/games/o-an-quan/oAnQuanEngine';
import type { Direction, OAnQuanState } from '@/games/o-an-quan/oAnQuan.types';

export const ONLINE_GAMES = ['chess', 'o-an-quan', 'caro', 'co-tuong', 'co-ganh'] as const;
export type OnlineGameId = (typeof ONLINE_GAMES)[number];

export const ROOM_TTL_MS = 6 * 60 * 60 * 1000;
export const MAX_STATE_CHARS = 12_000;
const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export interface SyncedGame {
  state: string;
  turn: string;
  status: 'playing' | 'ended';
  result: string;
  version: number;
  actor: string;
  restart?: boolean;
}

export type GameAction =
  | { game: 'chess'; from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' }
  | { game: 'caro'; index: number }
  | { game: 'co-tuong'; from: string; to: string }
  | { game: 'co-ganh'; from: number; to: number }
  | { game: 'o-an-quan'; pit: number; direction: Direction };

interface Reduced {
  state: unknown;
  turn: string;
  status: 'playing' | 'ended';
  result: string;
}

export function isOnlineGameId(value: string | undefined): value is OnlineGameId {
  return ONLINE_GAMES.includes(value as OnlineGameId);
}

export function seatPair(game: OnlineGameId): [string, string] {
  if (game === 'chess') return ['w', 'b'];
  if (game === 'co-tuong') return ['r', 'b'];
  if (game === 'co-ganh') return ['red', 'blue'];
  if (game === 'caro') return ['x', 'o'];
  return ['0', '1'];
}

export function seatLabel(game: OnlineGameId, seat: string): string {
  if (game === 'chess') return seat === 'w' ? 'Trắng' : 'Đen';
  if (game === 'co-tuong') return seat === 'r' ? 'Đỏ' : 'Đen';
  if (game === 'co-ganh') return seat === 'red' ? 'Đỏ' : 'Xanh';
  if (game === 'caro') return seat === 'x' ? 'Quân X' : 'Quân O';
  return seat === '0' ? 'Hàng dưới' : 'Hàng trên';
}

export function makeRoomCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => ROOM_ALPHABET[value % ROOM_ALPHABET.length]!).join('');
}

export function isRoomCode(value: string): boolean {
  return /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(value);
}

export function freshGame(game: OnlineGameId, actor: string): SyncedGame {
  const reduced = initialReduced(game);
  return {
    state: JSON.stringify(reduced.state),
    turn: reduced.turn,
    status: 'playing',
    result: '',
    version: 1,
    actor,
  };
}

export function restartGame(game: OnlineGameId, current: SyncedGame, actor: string): SyncedGame {
  return { ...freshGame(game, actor), version: current.version + 1, restart: true };
}

export function reduceMove(
  game: OnlineGameId,
  current: SyncedGame,
  action: GameAction,
  actor: string,
  seat: string,
): SyncedGame | null {
  if (current.status !== 'playing' || current.turn !== seat || action.game !== game) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(current.state);
    const reduced = applyReduced(game, parsed, action, seat);
    if (!reduced) return null;
    const state = JSON.stringify(reduced.state);
    if (state.length > MAX_STATE_CHARS) return null;
    return {
      state,
      turn: reduced.turn,
      status: reduced.status,
      result: reduced.status === 'ended' ? reduced.result : '',
      version: current.version + 1,
      actor,
    };
  } catch {
    return null;
  }
}

export function readState<T>(game: SyncedGame | null | undefined): T | null {
  if (!game) return null;
  try {
    return JSON.parse(game.state) as T;
  } catch {
    return null;
  }
}

function initialReduced(game: OnlineGameId): Reduced {
  if (game === 'chess') {
    const chess = new Chess();
    return { state: { fen: chess.fen(), sans: [], lastFrom: null, lastTo: null }, turn: 'w', status: 'playing', result: '' };
  }
  if (game === 'caro') {
    const state = createCaro();
    return { state, turn: state.turn, status: 'playing', result: '' };
  }
  if (game === 'co-tuong') {
    const state = createCoTuong();
    return { state, turn: state.turn, status: 'playing', result: '' };
  }
  if (game === 'co-ganh') {
    const state = createCoGanh();
    return { state, turn: state.turn, status: 'playing', result: '' };
  }
  const state = createOAnQuan();
  return { state, turn: String(state.currentPlayer), status: 'playing', result: '' };
}

function applyReduced(game: OnlineGameId, parsed: unknown, action: GameAction, seat: string): Reduced | null {
  if (game === 'chess' && action.game === 'chess') return applyChess(parsed, action, seat);
  if (game === 'caro' && action.game === 'caro') return applyCaro(parsed, action, seat);
  if (game === 'co-tuong' && action.game === 'co-tuong') return applyCoTuong(parsed, action, seat);
  if (game === 'co-ganh' && action.game === 'co-ganh') return applyCoGanh(parsed, action, seat);
  if (game === 'o-an-quan' && action.game === 'o-an-quan') return applyFolk(parsed, action, seat);
  return null;
}

function applyChess(parsed: unknown, action: Extract<GameAction, { game: 'chess' }>, seat: string): Reduced | null {
  const record = asRecord(parsed);
  if (!record || typeof record.fen !== 'string' || !Array.isArray(record.sans)) return null;
  const chess = new Chess();
  for (const san of record.sans) {
    if (typeof san !== 'string' || !chess.move(san)) return null;
  }
  if (chess.fen() !== record.fen || chess.turn() !== seat) return null;
  const moved = chess.move({
    from: action.from as Square,
    to: action.to as Square,
    promotion: action.promotion,
  });
  if (!moved) return null;
  const ended = chess.isGameOver();
  return {
    state: { fen: chess.fen(), sans: chess.history(), lastFrom: moved.from, lastTo: moved.to },
    turn: chess.turn(),
    status: ended ? 'ended' : 'playing',
    result: ended ? chessResult(chess) : '',
  };
}

function chessResult(chess: Chess): string {
  if (chess.isCheckmate()) return chess.turn() === 'w' ? 'Đen thắng' : 'Trắng thắng';
  if (chess.isStalemate()) return 'Hòa — hết nước đi';
  if (chess.isInsufficientMaterial()) return 'Hòa — không đủ lực';
  if (chess.isThreefoldRepetition()) return 'Hòa — lặp thế cờ';
  if (chess.isDraw()) return 'Hòa';
  return 'Ván đã kết thúc';
}

function applyCaro(parsed: unknown, action: Extract<GameAction, { game: 'caro' }>, seat: string): Reduced | null {
  const state = parsed as CaroState;
  if (!state || !Array.isArray(state.cells) || state.turn !== seat) return null;
  try {
    const next = place(state, action.index);
    return { state: next, turn: next.turn, status: next.status, result: caroResult(next) };
  } catch {
    return null;
  }
}

function applyCoTuong(parsed: unknown, action: Extract<GameAction, { game: 'co-tuong' }>, seat: string): Reduced | null {
  const state = parsed as CoTuongState;
  if (!state || typeof state.squares !== 'string' || state.turn !== seat) return null;
  const moved = tryCoTuongMove(state, action.from, action.to);
  if (!moved) return null;
  const ended = isGameOver(moved.state);
  return {
    state: moved.state,
    turn: moved.state.turn,
    status: ended ? 'ended' : 'playing',
    result: ended ? coTuongResult(moved.state) : '',
  };
}

function applyCoGanh(parsed: unknown, action: Extract<GameAction, { game: 'co-ganh' }>, seat: string): Reduced | null {
  const state = parsed as CoGanhState;
  if (!state || !Array.isArray(state.cells) || state.turn !== seat) return null;
  const moved = tryCoGanhMove(state, action.from, action.to);
  if (!moved) return null;
  return {
    state: moved.state,
    turn: moved.state.turn,
    status: moved.state.status,
    result: moved.state.status === 'ended' ? coGanhResult(moved.state) : '',
  };
}

function applyFolk(parsed: unknown, action: Extract<GameAction, { game: 'o-an-quan' }>, seat: string): Reduced | null {
  const state = parsed as OAnQuanState;
  if (!state || !Array.isArray(state.pits) || String(state.currentPlayer) !== seat) return null;
  if (action.direction !== 'cw' && action.direction !== 'ccw') return null;
  try {
    const moved = applyOAnQuan(state, action.pit, action.direction);
    return {
      state: moved.state,
      turn: String(moved.state.currentPlayer),
      status: moved.state.status,
      result: moved.state.status === 'ended' ? oAnQuanResult(moved.state) : '',
    };
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

export function viewerFlips(game: OnlineGameId, seat: string | null): boolean {
  if (!seat) return false;
  if (game === 'chess' || game === 'co-tuong') return seat === 'b';
  if (game === 'co-ganh') return seat === 'blue';
  return false;
}
