import { describe, expect, it } from 'vitest';
import {
  applyMove,
  applyResupplyIfNeeded,
  bothQuanPitsEmpty,
  createInitialState,
  getValidPits,
  isValidMove,
  nextIndex,
  playerHasMove,
  scoreOf,
} from './oAnQuanEngine';
import {
  DIRECTION,
  GAME_END_REASON,
  LEFT_QUAN_INDEX,
  PLAYER,
  RIGHT_QUAN_INDEX,
  type OAnQuanState,
  type PlayerId,
} from './oAnQuan.types';

/** Bàn không còn quân dân, vẫn giữ 1 quan mỗi đầu để ván chưa kết thúc. */
function emptyDanPits(currentPlayer: PlayerId = PLAYER.one): OAnQuanState {
  const state = createInitialState();
  for (const pit of state.pits) {
    if (pit.type === 'dan') {
      pit.dan = 0;
      pit.quan = 0;
    }
  }
  state.currentPlayer = currentPlayer;
  return state;
}

function withOpponentMove(state: OAnQuanState): OAnQuanState {
  state.pits[6].dan = Math.max(state.pits[6].dan, 1);
  return state;
}

describe('oAnQuanEngine — khởi tạo', () => {
  it('sets 5 dân in each dân pit and 1 quan in each quan pit', () => {
    const state = createInitialState();
    expect(state.pits).toHaveLength(12);
    expect(state.pits.filter((pit) => pit.type === 'dan')).toHaveLength(10);
    expect(state.pits.filter((pit) => pit.type === 'quan')).toHaveLength(2);
    for (const pit of state.pits) {
      if (pit.type === 'dan') {
        expect(pit.dan).toBe(5);
        expect(pit.quan).toBe(0);
      } else {
        expect(pit.dan).toBe(0);
        expect(pit.quan).toBe(1);
      }
    }
    expect(state.currentPlayer).toBe(PLAYER.one);
    expect(state.status).toBe('playing');
  });
});

describe('oAnQuanEngine — chọn ô hợp lệ', () => {
  it('only allows the current player to pick occupied dân pits on their row', () => {
    const state = createInitialState();
    expect(getValidPits(state)).toEqual([0, 1, 2, 3, 4]);
    expect(isValidMove(state, 0)).toBe(true);
    expect(isValidMove(state, 6)).toBe(false);
    expect(isValidMove(state, LEFT_QUAN_INDEX)).toBe(false);
    expect(isValidMove(state, RIGHT_QUAN_INDEX)).toBe(false);
  });

  it('rejects empty pits and opponent pits', () => {
    const state = createInitialState();
    state.pits[2].dan = 0;
    expect(isValidMove(state, 2)).toBe(false);
    expect(() => applyMove(state, 6, DIRECTION.cw)).toThrow();
  });
});

describe('oAnQuanEngine — rải quân', () => {
  it('sows clockwise one token per pit including quan pits', () => {
    const state = withOpponentMove(emptyDanPits());
    state.pits[0].dan = 3;
    state.pits[RIGHT_QUAN_INDEX].quan = 0;
    const { state: next, events } = applyMove(state, 0, DIRECTION.cw);
    expect(next.pits[0].dan).toBe(0);
    expect(next.pits[1].dan).toBe(1);
    expect(next.pits[2].dan).toBe(1);
    expect(next.pits[3].dan).toBe(1);
    expect(events.filter((event) => event.type === 'drop')).toHaveLength(3);
    expect(next.currentPlayer).toBe(PLAYER.two);
  });

  it('sows counterclockwise from the same pit', () => {
    const state = emptyDanPits();
    state.pits[0].dan = 3;
    const { state: next } = applyMove(state, 0, DIRECTION.ccw);
    expect(next.pits[0].dan).toBe(0);
    expect(next.pits[11].dan).toBe(1);
    expect(next.pits[10].dan).toBe(1);
    expect(next.pits[9].dan).toBe(1);
  });

  it('relays when the next pit is a dân pit with tokens', () => {
    const state = withOpponentMove(emptyDanPits());
    state.pits[0].dan = 1;
    state.pits[2].dan = 2;
    const { state: next, events } = applyMove(state, 0, DIRECTION.cw);
    expect(events.some((event) => event.type === 'relay' && event.pit === 2)).toBe(true);
    expect(next.pits[1].dan).toBe(1);
    expect(next.pits[2].dan).toBe(0);
    expect(next.pits[3].dan).toBe(1);
    expect(next.pits[4].dan).toBe(1);
  });

  it('does not pick up tokens from a occupied quan pit to continue sowing', () => {
    const state = emptyDanPits();
    state.pits[4].dan = 1;
    state.pits[RIGHT_QUAN_INDEX].dan = 4;
    state.pits[7].dan = 1;
    const { state: next, events } = applyMove(state, 4, DIRECTION.cw);
    expect(events.some((event) => event.type === 'relay')).toBe(false);
    expect(next.pits[RIGHT_QUAN_INDEX].dan).toBe(5);
    expect(next.pits[RIGHT_QUAN_INDEX].quan).toBe(1);
  });
});

describe('oAnQuanEngine — ăn quân', () => {
  it('captures the pit after an empty pit', () => {
    const state = withOpponentMove(emptyDanPits());
    state.pits[0].dan = 1;
    state.pits[3].dan = 4;
    state.pits[4].dan = 1;
    const { state: next, events } = applyMove(state, 0, DIRECTION.cw);
    expect(events.some((event) => event.type === 'capture' && event.pit === 3)).toBe(true);
    expect(next.pits[3].dan).toBe(0);
    expect(next.captured[PLAYER.one].dan).toBe(4);
  });

  it('chains captures across alternating empty pits', () => {
    const state = withOpponentMove(emptyDanPits());
    state.pits[0].dan = 1;
    state.pits[3].dan = 3;
    const { state: next, events } = applyMove(state, 0, DIRECTION.cw);
    const captures = events.filter((event) => event.type === 'capture');
    expect(captures.map((event) => event.pit)).toEqual([3, RIGHT_QUAN_INDEX]);
    expect(next.captured[PLAYER.one]).toEqual({ dan: 3, quan: 1 });
  });

  it('can capture a quan pit by jumping an empty dân pit', () => {
    const state = withOpponentMove(emptyDanPits());
    state.pits[2].dan = 1;
    state.pits[RIGHT_QUAN_INDEX].dan = 2;
    const { state: next } = applyMove(state, 2, DIRECTION.cw);
    expect(next.pits[RIGHT_QUAN_INDEX].quan).toBe(0);
    expect(next.pits[RIGHT_QUAN_INDEX].dan).toBe(0);
    expect(next.captured[PLAYER.one]).toEqual({ dan: 2, quan: 1 });
    expect(next.status).toBe('playing');
  });
});

describe('oAnQuanEngine — chuyển lượt', () => {
  it('hands the turn to the other player after a completed move', () => {
    const state = emptyDanPits();
    state.pits[1].dan = 1;
    state.pits[6].dan = 2;
    const { state: next } = applyMove(state, 1, DIRECTION.cw);
    expect(next.currentPlayer).toBe(PLAYER.two);
    expect(next.status).toBe('playing');
    expect(getValidPits(next)).toEqual([6]);
  });
});

describe('oAnQuanEngine — tiếp quân', () => {
  it('places one dân in each own pit when the row is empty and captured dân are enough', () => {
    const state = emptyDanPits(PLAYER.two);
    state.captured[PLAYER.two].dan = 8;
    const { state: next, events } = applyResupplyIfNeeded(state);
    expect(events.some((event) => event.type === 'resupply')).toBe(true);
    expect(next.captured[PLAYER.two].dan).toBe(3);
    expect(next.pits.slice(6, 11).every((pit) => pit.dan === 1)).toBe(true);
    expect(playerHasMove(next, PLAYER.two)).toBe(true);
  });

  it('converts a captured quan into dân when needed to resupply', () => {
    const state = emptyDanPits(PLAYER.one);
    state.captured[PLAYER.one].quan = 1;
    const { state: next } = applyResupplyIfNeeded(state);
    expect(next.captured[PLAYER.one].quan).toBe(0);
    expect(next.captured[PLAYER.one].dan).toBe(0);
    expect(next.pits.slice(0, 5).every((pit) => pit.dan === 1)).toBe(true);
  });

  it('ends the game if the player cannot resupply', () => {
    const state = emptyDanPits(PLAYER.one);
    state.captured[PLAYER.one] = { dan: 2, quan: 0 };
    const { state: next } = applyResupplyIfNeeded(state);
    expect(next.status).toBe('ended');
    expect(next.winner).toBe(PLAYER.two);
    expect(next.endReason).toBe(GAME_END_REASON.cannotResupply);
  });
});

describe('oAnQuanEngine — kết thúc ván', () => {
  it('ends when both quan pits are emptied and awards remaining dân to their owners', () => {
    const state = emptyDanPits();
    state.pits[LEFT_QUAN_INDEX].quan = 0;
    state.pits[2].dan = 1;
    state.pits[0].dan = 4;
    state.pits[8].dan = 6;
    const { state: next } = applyMove(state, 2, DIRECTION.cw);
    expect(bothQuanPitsEmpty(next)).toBe(true);
    expect(next.status).toBe('ended');
    expect(next.endReason).toBe(GAME_END_REASON.bothQuanEmpty);
    expect(next.pits[0].dan).toBe(0);
    expect(next.pits[8].dan).toBe(0);
    expect(next.captured[PLAYER.one]).toEqual({ dan: 5, quan: 1 });
    expect(next.captured[PLAYER.two]).toEqual({ dan: 6, quan: 0 });
    expect(scoreOf(next.captured[0])).toBe(10);
    expect(scoreOf(next.captured[1])).toBe(6);
    expect(next.winner).toBe(PLAYER.one);
  });

  it('declares a draw when scores are equal after both quan pits empty', () => {
    const state = emptyDanPits();
    state.pits[LEFT_QUAN_INDEX].quan = 0;
    state.pits[2].dan = 1;
    state.captured[PLAYER.one] = { dan: 4, quan: 1 };
    state.captured[PLAYER.two] = { dan: 15, quan: 0 };
    const { state: next } = applyMove(state, 2, DIRECTION.cw);
    expect(next.status).toBe('ended');
    expect(next.winner).toBe('draw');
    expect(scoreOf(next.captured[0])).toBe(scoreOf(next.captured[1]));
  });
});

describe('oAnQuanEngine — tiện ích vòng bàn', () => {
  it('wraps around the 12-pit loop', () => {
    expect(nextIndex(11, DIRECTION.cw)).toBe(0);
    expect(nextIndex(0, DIRECTION.ccw)).toBe(11);
  });
});
