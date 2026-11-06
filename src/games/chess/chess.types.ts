import type { Color, PieceSymbol, Square } from 'chess.js';

export type ChessOpponent = 'human' | 'ai';
export type ChessAiLevel = 'easy' | 'medium' | 'hard';

export interface ChessPiece {
  type: PieceSymbol;
  color: Color;
}

export interface ChessSquare {
  square: Square;
  piece: ChessPiece | null;
}

export type ChessStatus =
  | 'playing'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'draw-insufficient'
  | 'draw-threefold'
  | 'draw-fifty'
  | 'draw';

export interface LegalMove {
  from: Square;
  to: Square;
  san: string;
  promotion?: PieceSymbol;
  captured?: PieceSymbol;
}

export interface AppliedMove {
  fen: string;
  san: string;
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
}

export interface ChessSnapshot {
  fen: string;
  turn: Color;
  status: ChessStatus;
  board: ChessSquare[][];
  history: string[];
  inCheck: boolean;
  isGameOver: boolean;
}
