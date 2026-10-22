import { describe, expect, it } from 'vitest';
import { fantasyPieceSrc } from './ChessPiece';

describe('fantasyPieceSrc', () => {
  it('maps every piece to a local Fantasy SVG path', () => {
    expect(fantasyPieceSrc('w', 'k')).toBe('/pieces/fantasy/wK.svg');
    expect(fantasyPieceSrc('w', 'q')).toBe('/pieces/fantasy/wQ.svg');
    expect(fantasyPieceSrc('w', 'r')).toBe('/pieces/fantasy/wR.svg');
    expect(fantasyPieceSrc('w', 'b')).toBe('/pieces/fantasy/wB.svg');
    expect(fantasyPieceSrc('w', 'n')).toBe('/pieces/fantasy/wN.svg');
    expect(fantasyPieceSrc('w', 'p')).toBe('/pieces/fantasy/wP.svg');
    expect(fantasyPieceSrc('b', 'k')).toBe('/pieces/fantasy/bK.svg');
    expect(fantasyPieceSrc('b', 'q')).toBe('/pieces/fantasy/bQ.svg');
    expect(fantasyPieceSrc('b', 'r')).toBe('/pieces/fantasy/bR.svg');
    expect(fantasyPieceSrc('b', 'b')).toBe('/pieces/fantasy/bB.svg');
    expect(fantasyPieceSrc('b', 'n')).toBe('/pieces/fantasy/bN.svg');
    expect(fantasyPieceSrc('b', 'p')).toBe('/pieces/fantasy/bP.svg');
  });
});
