export const CO_GANH_SIZE = 5;
export const CO_GANH_POINTS = CO_GANH_SIZE * CO_GANH_SIZE;

export const CO_GANH_EMPTY = 0;
export const CO_GANH_RED = 1;
export const CO_GANH_BLUE = 2;

export type CoGanhSide = 'red' | 'blue';
export type CoGanhLevel = 'easy' | 'medium' | 'hard';
export type CoGanhOpponent = 'ai' | 'local';
export type CoGanhStatus = 'playing' | 'ended';

export interface CoGanhState {
  cells: number[];
  turn: CoGanhSide;
  status: CoGanhStatus;
  winner: CoGanhSide | null;
  lastFrom: number | null;
  lastTo: number | null;
  ganh: number[];
  vay: number[];
  history: string[];
}

export interface CoGanhMove {
  from: number;
  to: number;
}

export interface CoGanhMoveResult {
  state: CoGanhState;
  from: number;
  to: number;
  ganh: number[];
  vay: number[];
  notation: string;
}
