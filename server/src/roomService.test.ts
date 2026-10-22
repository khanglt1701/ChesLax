import { describe, expect, it } from 'vitest';
import { hashToken } from './hash';
import { MemoryRatingRepository } from './ratingRepository';
import { RoomService, type PlayerSession } from './roomService';

function session(id: string, socketId = id): PlayerSession {
  return {
    playerId: id,
    tokenHash: hashToken(`token-${id}`),
    name: id,
    avatarId: 'seal-1',
    socketId,
  };
}

function service(): RoomService {
  return new RoomService(new MemoryRatingRepository(), () => 1_700_000_000_000);
}

describe('RoomService', () => {
  it('creates a chess room and starts when a second player joins', () => {
    const rooms = service();
    const created = rooms.createRoom(session('host'), { game: 'chess', colorPref: 'w' });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.room.status).toBe('waiting');
    const joined = rooms.joinRoom(session('guest'), created.room.code);
    expect(joined.ok).toBe(true);
    if (!joined.ok) return;
    expect(joined.room.status).toBe('playing');
    expect(joined.room.seats).toHaveLength(2);
  });

  it('rejects a third player and the same identity taking both seats', () => {
    const rooms = service();
    const created = rooms.createRoom(session('host'), { game: 'chess', colorPref: 'w' });
    if (!created.ok) throw new Error('create failed');
    const again = rooms.joinRoom(session('host'), created.room.code);
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.room.seats).toHaveLength(1);
    rooms.joinRoom(session('guest'), created.room.code);
    const third = rooms.joinRoom(session('intruder'), created.room.code);
    expect(third.ok).toBe(false);
    if (third.ok) return;
    expect(third.code).toBe('ROOM_FULL');
  });

  it('validates chess turns, illegal moves, and stale versions', () => {
    const rooms = service();
    const created = rooms.createRoom(session('white'), { game: 'chess', colorPref: 'w' });
    if (!created.ok) throw new Error('create failed');
    rooms.joinRoom(session('black'), created.room.code);
    const blackTurn = rooms.chessMove(session('black'), {
      code: created.room.code,
      from: 'e7',
      to: 'e5',
      version: 0,
    });
    expect(blackTurn.ok).toBe(false);
    if (blackTurn.ok) return;
    expect(blackTurn.code).toBe('NOT_YOUR_TURN');

    const illegal = rooms.chessMove(session('white'), {
      code: created.room.code,
      from: 'e2',
      to: 'e5',
      version: 0,
    });
    expect(illegal.ok).toBe(false);
    if (illegal.ok) return;
    expect(illegal.code).toBe('ILLEGAL_MOVE');

    const okMove = rooms.chessMove(session('white'), {
      code: created.room.code,
      from: 'e2',
      to: 'e4',
      version: 0,
    });
    expect(okMove.ok).toBe(true);
    const duplicate = rooms.chessMove(session('white'), {
      code: created.room.code,
      from: 'e2',
      to: 'e4',
      version: 0,
    });
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.code).toBe('STALE_STATE');
  });

  it('rejects an outsider chess move', () => {
    const rooms = service();
    const created = rooms.createRoom(session('white'), { game: 'chess', colorPref: 'w' });
    if (!created.ok) throw new Error('create failed');
    rooms.joinRoom(session('black'), created.room.code);
    const outsider = rooms.chessMove(session('spy'), {
      code: created.room.code,
      from: 'e2',
      to: 'e4',
      version: 0,
    });
    expect(outsider.ok).toBe(false);
    if (!outsider.ok) expect(outsider.code).toBe('UNAUTHORIZED');
  });

  it('validates o an quan ownership and direction on the server', () => {
    const rooms = service();
    const created = rooms.createRoom(session('p0'), { game: 'o-an-quan' });
    if (!created.ok) throw new Error('create failed');
    rooms.joinRoom(session('p1'), created.room.code);
    const wrongPit = rooms.oAnQuanMove(session('p0'), {
      code: created.room.code,
      pit: 6,
      direction: 'cw',
      version: 0,
    });
    expect(wrongPit.ok).toBe(false);
    const okMove = rooms.oAnQuanMove(session('p0'), {
      code: created.room.code,
      pit: 0,
      direction: 'cw',
      version: 0,
    });
    expect(okMove.ok).toBe(true);
    if (!okMove.ok) return;
    expect(okMove.room.version).toBe(1);
  });

  it('applies rating once after a resignation', () => {
    const ratings = new MemoryRatingRepository();
    const rooms = new RoomService(ratings, () => 1_700_000_000_000);
    const created = rooms.createRoom(session('white'), { game: 'chess', colorPref: 'w' });
    if (!created.ok) throw new Error('create failed');
    rooms.joinRoom(session('black'), created.room.code);
    const first = rooms.resign(session('white'), created.room.code);
    expect(first.ok).toBe(true);
    const again = rooms.resign(session('white'), created.room.code);
    expect(again.ok).toBe(false);
    const white = ratings.get('white', { name: 'white', avatarId: 'seal-1' });
    const black = ratings.get('black', { name: 'black', avatarId: 'seal-1' });
    expect(white.ratings.chess.losses).toBe(1);
    expect(black.ratings.chess.wins).toBe(1);
    expect(white.history).toHaveLength(1);
    expect(black.ratings.chess.gamesPlayed).toBe(1);
  });

  it('restores the same room after a disconnect instead of creating a new game', () => {
    const rooms = service();
    const created = rooms.createRoom(session('host', 's1'), { game: 'chess', colorPref: 'w' });
    if (!created.ok) throw new Error('create failed');
    rooms.joinRoom(session('guest', 's2'), created.room.code);
    rooms.chessMove(session('host', 's1'), {
      code: created.room.code,
      from: 'e2',
      to: 'e4',
      version: 0,
    });
    rooms.disconnect('host', 's1');
    const rejoin = rooms.joinRoom(session('host', 's3'), created.room.code);
    expect(rejoin.ok).toBe(true);
    if (!rejoin.ok) return;
    expect(rejoin.room.version).toBe(1);
    expect(rejoin.room.chess?.history).toEqual(['e4']);
    expect(rejoin.room.status).toBe('playing');
  });

  it('keeps chess and o an quan rooms independent', () => {
    const rooms = service();
    const chess = rooms.createRoom(session('a'), { game: 'chess', colorPref: 'w' });
    const folk = rooms.createRoom(session('c'), { game: 'o-an-quan' });
    if (!chess.ok || !folk.ok) throw new Error('create failed');
    rooms.joinRoom(session('b'), chess.room.code);
    rooms.joinRoom(session('d'), folk.room.code);
    rooms.chessMove(session('a'), { code: chess.room.code, from: 'e2', to: 'e4', version: 0 });
    expect(rooms.getRoom(folk.room.code)?.version).toBe(0);
    expect(rooms.getRoom(chess.room.code)?.version).toBe(1);
  });
});
