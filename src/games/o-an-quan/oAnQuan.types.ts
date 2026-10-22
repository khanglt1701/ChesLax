export const PLAYER = {
  one: 0,
  two: 1,
} as const;

export type PlayerId = (typeof PLAYER)[keyof typeof PLAYER];

export const DIRECTION = {
  cw: 'cw',
  ccw: 'ccw',
} as const;

export type Direction = (typeof DIRECTION)[keyof typeof DIRECTION];

export const PIT_COUNT = 12;
export const DAN_PER_PIT = 5;
export const QUAN_VALUE = 5;
export const RESUPPLY_COST = 5;

export const RIGHT_QUAN_INDEX = 5;
export const LEFT_QUAN_INDEX = 11;

export interface Pit {
  index: number;
  type: 'dan' | 'quan';
  dan: number;
  quan: number;
  owner: PlayerId | null;
}

export const GAME_END_REASON = {
  bothQuanEmpty: 'both_quan_empty',
  cannotResupply: 'cannot_resupply',
} as const;

export type GameEndReason = (typeof GAME_END_REASON)[keyof typeof GAME_END_REASON];

export interface CapturedPieces {
  dan: number;
  quan: number;
}

export interface OAnQuanState {
  pits: Pit[];
  currentPlayer: PlayerId;
  captured: [CapturedPieces, CapturedPieces];
  status: 'playing' | 'ended';
  winner: PlayerId | 'draw' | null;
  endReason: GameEndReason | null;
  resupplied: boolean;
}

export type OAnQuanEvent =
  | { type: 'pick'; pit: number; dan: number }
  | { type: 'drop'; pit: number }
  | { type: 'relay'; pit: number; dan: number }
  | { type: 'capture'; pit: number; dan: number; quan: number }
  | { type: 'resupply'; player: PlayerId; convertedQuan: number }
  | { type: 'turnEnd'; nextPlayer: PlayerId }
  | { type: 'gameEnd'; winner: PlayerId | 'draw'; reason: GameEndReason };

export interface MoveResult {
  state: OAnQuanState;
  events: OAnQuanEvent[];
  description: string;
}

export interface MoveRecord {
  player: PlayerId;
  pit: number;
  direction: Direction;
  description: string;
}
