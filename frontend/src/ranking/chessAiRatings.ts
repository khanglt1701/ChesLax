import type { ChessAiLevel } from '@/games/chess/chess.types';
import { aiOpponentPersona } from './aiOpponentPersona';

export const CHESS_AI_RATINGS: Record<ChessAiLevel, number> = {
  easy: 800,
  medium: 1_200,
  hard: 1_800,
};

export function chessAiOpponentName(level: ChessAiLevel): string {
  return aiOpponentPersona(level).name;
}
