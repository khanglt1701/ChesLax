import { readStorage, writeStorage } from '@/utils/storage';

export type BoardThemeId = 'wood' | 'marble' | 'modern';
export type PieceSetId = 'fantasy' | 'classic' | 'modern';

export interface ChessAppearance {
  boardTheme: BoardThemeId;
  pieceSet: PieceSetId;
}

const STORAGE_KEY = 'cheslax.chess.appearance';

export const DEFAULT_CHESS_APPEARANCE: ChessAppearance = {
  boardTheme: 'wood',
  pieceSet: 'fantasy',
};

export const BOARD_THEMES: { id: BoardThemeId; label: string; description: string }[] = [
  { id: 'wood', label: 'Gỗ cổ điển', description: 'Khung gỗ, ô kem và xanh rêu' },
  { id: 'marble', label: 'Đá cẩm thạch', description: 'Mặt đá sáng / xám than' },
  { id: 'modern', label: 'Hiện đại', description: 'Ô mint và teal phẳng' },
];

export const PIECE_SETS: { id: PieceSetId; label: string; description: string }[] = [
  { id: 'fantasy', label: 'Fantasy', description: 'Maurizio Monge — bộ SVG gốc' },
  { id: 'classic', label: 'Classic', description: 'Staunton gỗ ngà / mun' },
  { id: 'modern', label: 'Modern', description: 'Viền kim loại, tương phản cao' },
];

export function parseChessAppearance(value: unknown): ChessAppearance {
  if (!value || typeof value !== 'object') return DEFAULT_CHESS_APPEARANCE;
  const record = value as Partial<ChessAppearance>;
  return {
    boardTheme: BOARD_THEMES.some((theme) => theme.id === record.boardTheme)
      ? (record.boardTheme as BoardThemeId)
      : DEFAULT_CHESS_APPEARANCE.boardTheme,
    pieceSet: PIECE_SETS.some((set) => set.id === record.pieceSet)
      ? (record.pieceSet as PieceSetId)
      : DEFAULT_CHESS_APPEARANCE.pieceSet,
  };
}

export function loadChessAppearance(): ChessAppearance {
  return parseChessAppearance(readStorage<unknown>(STORAGE_KEY, null));
}

export function saveChessAppearance(appearance: ChessAppearance): void {
  writeStorage(STORAGE_KEY, parseChessAppearance(appearance));
}
