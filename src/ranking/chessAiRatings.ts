import type { ChessAiLevel } from '@/games/chess/chess.types';

export const CHESS_AI_RATINGS: Record<ChessAiLevel, number> = {
  easy: 800,
  medium: 1_200,
  hard: 1_800,
};

export function chessAiOpponentName(level: ChessAiLevel): string {
  if (level === 'easy') return 'Máy — Dễ';
  if (level === 'hard') return 'Máy — Khó';
  return 'Máy — Vừa';
}
