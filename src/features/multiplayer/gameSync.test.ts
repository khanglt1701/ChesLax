import { describe, expect, it } from 'vitest';
import { freshGame, isRoomCode, makeRoomCode, reduceMove, restartGame, seatPair } from './gameSync';

describe('online game sync', () => {
  it('accepts a legal chess move and rejects the same side moving again', () => {
    const started = freshGame('chess', 'host');
    const played = reduceMove('chess', started, { game: 'chess', from: 'e2', to: 'e4' }, 'host', 'w');
    expect(played?.turn).toBe('b');
    expect(played?.version).toBe(2);
    expect(reduceMove('chess', played!, { game: 'chess', from: 'd2', to: 'd4' }, 'host', 'w')).toBeNull();
    expect(reduceMove('chess', played!, { game: 'chess', from: 'e7', to: 'e5' }, 'guest', 'b')?.turn).toBe('w');
  });

  it('rejects an illegal chess move and a move before the game starts playing', () => {
    const started = freshGame('chess', 'host');
    expect(reduceMove('chess', started, { game: 'chess', from: 'e2', to: 'e5' }, 'host', 'w')).toBeNull();
    expect(reduceMove('chess', { ...started, status: 'ended' }, { game: 'chess', from: 'e2', to: 'e4' }, 'host', 'w')).toBeNull();
  });

  it('keeps caro turns exclusive and blocks a filled cell', () => {
    const started = freshGame('caro', 'host');
    const marked = reduceMove('caro', started, { game: 'caro', index: 0 }, 'host', 'x');
    expect(marked?.turn).toBe('o');
    expect(reduceMove('caro', marked!, { game: 'caro', index: 0 }, 'guest', 'o')).toBeNull();
    expect(reduceMove('caro', marked!, { game: 'caro', index: 1 }, 'host', 'x')).toBeNull();
  });

  it('restarts to the opening position with the next version', () => {
    const started = freshGame('co-tuong', 'host');
    const played = reduceMove('co-tuong', started, { game: 'co-tuong', from: 'h2', to: 'h9' }, 'host', 'r');
    expect(played).not.toBeNull();
    const again = restartGame('co-tuong', played!, 'host');
    expect(again.version).toBe(played!.version + 1);
    expect(again.restart).toBe(true);
    expect(again.turn).toBe(seatPair('co-tuong')[0]);
  });

  it('makes a six-character room code', () => {
    const code = makeRoomCode();
    expect(isRoomCode(code)).toBe(true);
    expect(isRoomCode('IO1234')).toBe(false);
  });
});
