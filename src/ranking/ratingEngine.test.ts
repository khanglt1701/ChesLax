import { describe, expect, it } from 'vitest';
import { applyRatedGame, canApplyRatedGame, createInitialRatingState } from './ratingEngine';
import type { ApplyRatedGameInput } from './ratingTypes';

function ratedWin(overrides: Partial<ApplyRatedGameInput> = {}): ApplyRatedGameInput {
  return {
    matchId: 'match-1',
    gameId: 'chess',
    finished: true,
    rated: true,
    result: 'win',
    opponentRating: 1_000,
    opponentName: 'Máy — Vừa',
    at: 1_700_000_000_000,
    ...overrides,
  };
}

describe('ratingEngine', () => {
  it('rejects practice, unfinished, or empty match ids', () => {
    const state = createInitialRatingState();
    expect(canApplyRatedGame(ratedWin({ rated: false }))).toBe(false);
    expect(canApplyRatedGame(ratedWin({ finished: false }))).toBe(false);
    expect(canApplyRatedGame(ratedWin({ matchId: '  ' }))).toBe(false);
    expect(applyRatedGame(state, ratedWin({ rated: false })).change).toBeNull();
    expect(applyRatedGame(state, ratedWin({ finished: false })).change).toBeNull();
  });

  it('updates chess rating on a finished rated win and promotes when crossing a threshold', () => {
    const start = createInitialRatingState();
    start.ratings.chess.rating = 1_790;
    const { state, change } = applyRatedGame(start, ratedWin({ opponentRating: 1_790 }));
    expect(change).not.toBeNull();
    expect(change?.oldRankId).toBe('ky-su');
    expect(state.ratings.chess.rating).toBeGreaterThan(1_790);
    expect(state.ratings.chess.wins).toBe(1);
    expect(state.ratings.chess.gamesPlayed).toBe(1);
    expect(state.ratings.chess.highestRating).toBe(state.ratings.chess.rating);
    expect(change?.promoted).toBe(state.ratings.chess.rating >= 1_800);
  });

  it('keeps o-an-quan rating untouched when chess is updated', () => {
    const start = createInitialRatingState();
    const folkBefore = start.ratings['o-an-quan'].rating;
    const { state } = applyRatedGame(start, ratedWin());
    expect(state.ratings['o-an-quan'].rating).toBe(folkBefore);
    expect(state.ratings['o-an-quan'].gamesPlayed).toBe(0);
    expect(state.ratings.chess.gamesPlayed).toBe(1);
  });

  it('does not duplicate history when the same match is applied twice', () => {
    const start = createInitialRatingState();
    const first = applyRatedGame(start, ratedWin());
    const second = applyRatedGame(first.state, ratedWin());
    expect(first.change).not.toBeNull();
    expect(second.change).toBeNull();
    expect(second.state.history).toHaveLength(1);
    expect(second.state.ratings.chess.gamesPlayed).toBe(1);
  });

  it('records a demotion when a loss crosses a rank boundary', () => {
    const start = createInitialRatingState();
    start.ratings.chess.rating = 1_000;
    const { change } = applyRatedGame(start, ratedWin({ result: 'loss', opponentRating: 1_000 }));
    expect(change?.newRating).toBe(984);
    expect(change?.demoted).toBe(true);
    expect(change?.oldRankId).toBe('ky-do');
    expect(change?.newRankId).toBe('hoc-ky');
  });
});
