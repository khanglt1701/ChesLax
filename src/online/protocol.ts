import type { Square } from 'chess.js';
import type { Direction, OAnQuanEvent, OAnQuanState } from '../games/o-an-quan/oAnQuan.types';
import type { RatingChange } from '../ranking/ratingTypes';

export type OnlineGameId = 'chess' | 'o-an-quan';
export type RoomStatus = 'waiting' | 'playing' | 'ended' | 'abandoned';
export type TimeControlId = 'off' | '5m' | '10m';
export type ColorPref = 'w' | 'b' | 'random';
export type ChessSide = 'w' | 'b';
export type OaqSide = 0 | 1;
export type PlayerSide = ChessSide | OaqSide;

export const TIME_CONTROL_MS: Record<TimeControlId, number> = {
  off: 0,
  '5m': 5 * 60 * 1000,
  '10m': 10 * 60 * 1000,
};

export const SOCKET_EVENTS = {
  hello: 'hello',
  createRoom: 'createRoom',
  joinRoom: 'joinRoom',
  leaveRoom: 'leaveRoom',
  chessMove: 'chessMove',
  oAnQuanMove: 'oAnQuanMove',
  resign: 'resign',
  roomState: 'roomState',
  error: 'serverError',
} as const;

export interface HelloPayload {
  playerId: string;
  token: string;
  name: string;
  avatarId: string;
}

export interface CreateRoomPayload {
  game: OnlineGameId;
  colorPref?: ColorPref;
  timeControl?: TimeControlId;
}

export interface JoinRoomPayload {
  code: string;
}

export interface ChessMovePayload {
  code: string;
  from: Square;
  to: Square;
  promotion?: 'q' | 'r' | 'b' | 'n';
  version: number;
}

export interface OAnQuanMovePayload {
  code: string;
  pit: number;
  direction: Direction;
  version: number;
}

export interface ResignPayload {
  code: string;
}

export interface PublicSeat {
  playerId: string;
  name: string;
  avatarId: string;
  connected: boolean;
  side: PlayerSide;
}

export interface ChessClockPublic {
  w: number;
  b: number;
  running: ChessSide | null;
}

export interface ChessPublicState {
  fen: string;
  turn: ChessSide;
  history: string[];
  lastMove: { from: Square; to: Square } | null;
  inCheck: boolean;
  isGameOver: boolean;
  status: string;
  clocks: ChessClockPublic | null;
}

export interface OAnQuanPublicState {
  state: OAnQuanState;
  history: string[];
  lastMove: { pit: number; direction: Direction } | null;
  lastEvents: OAnQuanEvent[];
}

export interface RoomResultPublic {
  reason: string;
  winnerSide: PlayerSide | 'draw' | null;
  rated: boolean;
  yourChange: RatingChange | null;
}

export interface RoomPublicState {
  code: string;
  game: OnlineGameId;
  status: RoomStatus;
  version: number;
  timeControl: TimeControlId;
  you: { playerId: string; side: PlayerSide } | null;
  seats: PublicSeat[];
  waiting: boolean;
  chess: ChessPublicState | null;
  oAnQuan: OAnQuanPublicState | null;
  result: RoomResultPublic | null;
  disconnectDeadline: number | null;
  createdAt: number;
}

export interface Ack<T = RoomPublicState> {
  ok: boolean;
  error?: string;
  code?: string;
  room?: T;
}

export const DISCONNECT_GRACE_MS = 3 * 60 * 1000;
export const LEAVE_GRACE_MS = 30 * 1000;
export const ROOM_IDLE_MS = 2 * 60 * 60 * 1000;
export const MAX_ROOMS = 500;
