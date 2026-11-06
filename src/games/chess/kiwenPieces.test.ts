import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { PieceSymbol } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { kiwenPieceSrc } from './ChessPiece';

const TYPES: PieceSymbol[] = ['k', 'q', 'r', 'b', 'n', 'p'];

describe('Kiwen-Suwi piece files', () => {
  it('maps each side and piece to its own local svg', () => {
    const paths = new Set<string>();
    for (const color of ['w', 'b'] as const) {
      for (const type of TYPES) {
        const src = kiwenPieceSrc(color, type);
        expect(src.startsWith('/pieces/kiwen-suwi/')).toBe(true);
        expect(src.endsWith('.svg')).toBe(true);
        expect(src.includes(color === 'w' ? 'white-' : 'black-')).toBe(true);
        expect(src.includes(color === 'w' ? 'black-' : 'white-')).toBe(false);
        paths.add(src);
        const file = resolve('public', src.slice(1));
        expect(readFileSync(file, 'utf8')).toContain('<svg');
      }
    }
    expect(paths.size).toBe(12);
  });
});
