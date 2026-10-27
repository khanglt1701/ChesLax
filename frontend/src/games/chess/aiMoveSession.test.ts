import { describe, expect, it, vi } from 'vitest';
import { AiMoveSession, remainingThinkDelay, scheduleAiReply } from './aiMoveSession';

describe('AI thinking delay and stale-move guards', () => {
  it('keeps the remaining delay non-blocking and never negative', () => {
    expect(remainingThinkDelay(0, 1000, 0)).toBe(1000);
    expect(remainingThinkDelay(0, 1000, 400)).toBe(600);
    expect(remainingThinkDelay(0, 1000, 1500)).toBe(0);
  });

  it('applies the move only after the delay and does not run compute on the same tick', () => {
    vi.useFakeTimers();
    const session = new AiMoveSession();
    const computeMove = vi.fn(() => ({ from: 'e7', to: 'e5' }));
    const applyMove = vi.fn();
    const onSettled = vi.fn();

    scheduleAiReply({
      session,
      delayMs: 1000,
      now: () => 0,
      computeMove,
      applyMove,
      onSettled,
    });

    expect(computeMove).not.toHaveBeenCalled();
    expect(applyMove).not.toHaveBeenCalled();

    vi.advanceTimersByTime(0);
    expect(computeMove).toHaveBeenCalledOnce();
    expect(applyMove).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(applyMove).toHaveBeenCalledWith({ from: 'e7', to: 'e5' });
    expect(onSettled).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('cancels a pending AI reply when the game is restarted', () => {
    vi.useFakeTimers();
    const session = new AiMoveSession();
    const applyMove = vi.fn();
    const cancel = scheduleAiReply({
      session,
      delayMs: 800,
      now: () => 0,
      computeMove: () => ({ from: 'e7', to: 'e5' }),
      applyMove,
    });

    vi.advanceTimersByTime(0);
    cancel();
    vi.advanceTimersByTime(2000);
    expect(applyMove).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('ignores a stale AI reply after a new game starts', () => {
    vi.useFakeTimers();
    const session = new AiMoveSession();
    const applyOld = vi.fn();
    const applyNew = vi.fn();

    scheduleAiReply({
      session,
      delayMs: 800,
      now: () => 0,
      computeMove: () => ({ from: 'a7', to: 'a6' }),
      applyMove: applyOld,
    });
    vi.advanceTimersByTime(0);

    scheduleAiReply({
      session,
      delayMs: 800,
      now: () => 0,
      computeMove: () => ({ from: 'e7', to: 'e5' }),
      applyMove: applyNew,
    });
    vi.advanceTimersByTime(0);
    vi.advanceTimersByTime(800);
    expect(applyOld).not.toHaveBeenCalled();
    expect(applyNew).toHaveBeenCalledWith({ from: 'e7', to: 'e5' });
    vi.useRealTimers();
  });
});
