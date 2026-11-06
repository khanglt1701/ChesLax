import { describe, expect, it } from 'vitest';
import { squareGrid, startingFen, getSnapshotFromFen } from './chessService';

describe('board orientation without coordinate labels', () => {
  it('maps white to the bottom of the unflipped board', () => {
    expect(squareGrid('a1', false)).toEqual({ x: 0, y: 7 });
    expect(squareGrid('h1', false)).toEqual({ x: 7, y: 7 });
    expect(squareGrid('a8', false)).toEqual({ x: 0, y: 0 });
    expect(squareGrid('e2', false)).toEqual({ x: 4, y: 6 });
  });

  it('maps black to the bottom when the board is flipped', () => {
    expect(squareGrid('a1', true)).toEqual({ x: 7, y: 0 });
    expect(squareGrid('h1', true)).toEqual({ x: 0, y: 0 });
    expect(squareGrid('a8', true)).toEqual({ x: 7, y: 7 });
  });

  it('keeps square indexes and starting orientation unchanged', () => {
    const snapshot = getSnapshotFromFen(startingFen());
    expect(snapshot.board[0][0]?.square).toBe('a8');
    expect(snapshot.board[7][0]?.square).toBe('a1');
    expect(snapshot.board[7][4]?.piece).toEqual({ type: 'k', color: 'w' });
    expect(snapshot.board[0][4]?.piece).toEqual({ type: 'k', color: 'b' });
  });
});
