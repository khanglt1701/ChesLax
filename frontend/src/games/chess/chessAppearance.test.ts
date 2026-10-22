import { describe, expect, it } from 'vitest';
import { DEFAULT_CHESS_APPEARANCE, parseChessAppearance } from './chessAppearance';

describe('parseChessAppearance', () => {
  it('returns defaults for invalid data', () => {
    expect(parseChessAppearance(null)).toEqual(DEFAULT_CHESS_APPEARANCE);
    expect(parseChessAppearance({ boardTheme: 'neon', pieceSet: 'pixel' })).toEqual(DEFAULT_CHESS_APPEARANCE);
  });

  it('keeps known theme and piece set', () => {
    expect(parseChessAppearance({ boardTheme: 'marble', pieceSet: 'modern' })).toEqual({
      boardTheme: 'marble',
      pieceSet: 'modern',
    });
    expect(parseChessAppearance({ boardTheme: 'wood', pieceSet: 'fantasy' })).toEqual({
      boardTheme: 'wood',
      pieceSet: 'fantasy',
    });
  });

  it('defaults to the Fantasy piece set', () => {
    expect(DEFAULT_CHESS_APPEARANCE.pieceSet).toBe('fantasy');
  });
});
