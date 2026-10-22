import { describe, expect, it } from 'vitest';
import {
  afterMoveClock,
  createClockState,
  formatClock,
  hasAnyClock,
  tickClock,
} from './chessClock';

describe('chessClock', () => {
  it('does not tick when both clocks are unlimited', () => {
    const settings = { gameTimeMs: 0, moveTimeMs: 0 };
    const state = createClockState(settings);
    expect(hasAnyClock(settings)).toBe(false);
    const next = tickClock(state, settings, 'w', 1500);
    expect(next.gameRemainingMs.w).toBe(0);
    expect(next.timedOut).toBeNull();
  });

  it('decreases only the active player total time', () => {
    const settings = { gameTimeMs: 60_000, moveTimeMs: 0 };
    const state = createClockState(settings);
    const next = tickClock(state, settings, 'w', 1000);
    expect(next.gameRemainingMs.w).toBe(59_000);
    expect(next.gameRemainingMs.b).toBe(60_000);
    expect(next.timedOut).toBeNull();
  });

  it('flags timeout when a player runs out of game time', () => {
    const settings = { gameTimeMs: 800, moveTimeMs: 0 };
    const state = createClockState(settings);
    const next = tickClock(state, settings, 'b', 1000);
    expect(next.gameRemainingMs.b).toBe(0);
    expect(next.timedOut).toBe('b');
  });

  it('flags timeout when the move clock expires', () => {
    const settings = { gameTimeMs: 60_000, moveTimeMs: 5_000 };
    const state = createClockState(settings);
    const next = tickClock(state, settings, 'w', 5_000);
    expect(next.moveRemainingMs).toBe(0);
    expect(next.timedOut).toBe('w');
    expect(next.gameRemainingMs.w).toBe(55_000);
  });

  it('resets the move clock after a completed move', () => {
    const settings = { gameTimeMs: 60_000, moveTimeMs: 15_000 };
    let state = createClockState(settings);
    state = tickClock(state, settings, 'w', 4_000);
    state = afterMoveClock(state, settings);
    expect(state.moveRemainingMs).toBe(15_000);
    expect(state.gameRemainingMs.w).toBe(56_000);
  });

  it('formats hours, minutes and scramble tenths', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(61_000)).toBe('1:01');
    expect(formatClock(3_661_000)).toBe('1:01:01');
    expect(formatClock(2500)).toBe('2.5');
  });
});
