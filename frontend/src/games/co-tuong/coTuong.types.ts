export type CoTuongSide = 'r' | 'b';
export type CoTuongSquare = string;
export type CoTuongLevel = 'easy' | 'medium' | 'hard';
export type CoTuongOpponent = 'ai' | 'local';

export const COTUONG_FILES = 9;
export const COTUONG_RANKS = 10;
export const COTUONG_SQUARES = COTUONG_FILES * COTUONG_RANKS;
export const STARTING_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR r';

export interface CoTuongState {
  squares: string;
  turn: CoTuongSide;
  history: string[];
  keys: string[];
  lastFrom: string | null;
  lastTo: string | null;
}

export interface CoTuongLegalMove {
  from: string;
  to: string;
}

export interface CoTuongMoveResult {
  state: CoTuongState;
  notation: string;
  from: string;
  to: string;
  captured: string | null;
}

export const PIECE_LABELS: Record<string, { glyph: string; name: string }> = {
  K: { glyph: '帥', name: 'Tướng' },
  A: { glyph: '仕', name: 'Sĩ' },
  B: { glyph: '相', name: 'Tượng' },
  N: { glyph: '傌', name: 'Mã' },
  R: { glyph: '俥', name: 'Xe' },
  C: { glyph: '炮', name: 'Pháo' },
  P: { glyph: '兵', name: 'Tốt' },
  k: { glyph: '將', name: 'Tướng' },
  a: { glyph: '士', name: 'Sĩ' },
  b: { glyph: '象', name: 'Tượng' },
  n: { glyph: '馬', name: 'Mã' },
  r: { glyph: '車', name: 'Xe' },
  c: { glyph: '砲', name: 'Pháo' },
  p: { glyph: '卒', name: 'Tốt' },
};

export function pieceName(piece: string): string {
  return PIECE_LABELS[piece]?.name ?? piece;
}

export function pieceGlyph(piece: string): string {
  return PIECE_LABELS[piece]?.glyph ?? piece;
}

export function isRedPiece(piece: string): boolean {
  return piece !== '' && piece === piece.toUpperCase() && piece !== '.';
}
