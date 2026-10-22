import { readStorage, writeStorage } from '@/utils/storage';
import { DEFAULT_CHESS_SETTINGS, settingsSummary, type ChessTimeSettings } from './chessClock';
import { aiLevelLabel } from './chessAi';
import type { ChessAiLevel, ChessOpponent } from './chess.types';

const SETTINGS_KEY = 'cheslax.chess.settings';

export interface ChessPlaySettings extends ChessTimeSettings {
  opponent: ChessOpponent;
  aiLevel: ChessAiLevel;
  playerColor: 'w' | 'b';
}

export const DEFAULT_CHESS_PLAY_SETTINGS: ChessPlaySettings = {
  ...DEFAULT_CHESS_SETTINGS,
  opponent: 'ai',
  aiLevel: 'medium',
  playerColor: 'w',
};

function parseAiLevel(value: unknown): ChessAiLevel {
  if (value === 'easy' || value === 'medium' || value === 'hard') return value;
  return DEFAULT_CHESS_PLAY_SETTINGS.aiLevel;
}

export function loadChessSettings(): ChessPlaySettings {
  const saved = readStorage<Partial<ChessPlaySettings> | null>(SETTINGS_KEY, null);
  if (!saved) return DEFAULT_CHESS_PLAY_SETTINGS;
  return {
    gameTimeMs: typeof saved.gameTimeMs === 'number' ? saved.gameTimeMs : DEFAULT_CHESS_SETTINGS.gameTimeMs,
    moveTimeMs: typeof saved.moveTimeMs === 'number' ? saved.moveTimeMs : DEFAULT_CHESS_SETTINGS.moveTimeMs,
    opponent: saved.opponent === 'human' ? 'human' : 'ai',
    aiLevel: parseAiLevel(saved.aiLevel),
    playerColor: saved.playerColor === 'b' ? 'b' : 'w',
  };
}

export function saveChessSettings(settings: ChessPlaySettings): void {
  writeStorage(SETTINGS_KEY, settings);
}

export function playSummary(settings: ChessPlaySettings): string {
  const time = settingsSummary(settings);
  if (settings.opponent === 'human') return `Hai người · ${time}`;
  const color = settings.playerColor === 'w' ? 'Trắng' : 'Đen';
  return `Máy ${aiLevelLabel(settings.aiLevel)} · Bạn cầm ${color} · ${time}`;
}
