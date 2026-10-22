import { readStorage, writeStorage } from '@/utils/storage';
import { DEFAULT_CHESS_SETTINGS, type ChessTimeSettings } from './chessClock';

const SETTINGS_KEY = 'cheslax.chess.settings';

export function loadChessSettings(): ChessTimeSettings {
  const saved = readStorage<Partial<ChessTimeSettings> | null>(SETTINGS_KEY, null);
  if (!saved) return DEFAULT_CHESS_SETTINGS;
  return {
    gameTimeMs: typeof saved.gameTimeMs === 'number' ? saved.gameTimeMs : DEFAULT_CHESS_SETTINGS.gameTimeMs,
    moveTimeMs: typeof saved.moveTimeMs === 'number' ? saved.moveTimeMs : DEFAULT_CHESS_SETTINGS.moveTimeMs,
  };
}

export function saveChessSettings(settings: ChessTimeSettings): void {
  writeStorage(SETTINGS_KEY, settings);
}
