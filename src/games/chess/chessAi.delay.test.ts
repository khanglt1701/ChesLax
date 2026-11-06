import { describe, expect, it } from 'vitest';
import { aiThinkDelayMs } from './chessAi';

describe('configurable AI think delay', () => {
  it('uses a human-like delay of about 800–1500ms for ordinary moves', () => {
    for (const level of ['easy', 'medium', 'hard'] as const) {
      const delay = aiThinkDelayMs(level);
      expect(delay).toBeGreaterThanOrEqual(800);
      expect(delay).toBeLessThanOrEqual(1500);
    }
  });

  it('adds extra delay for more complex positions', () => {
    const ordinary = aiThinkDelayMs('medium');
    const complex = aiThinkDelayMs('medium', { legalMoves: 40, inCheck: true });
    expect(complex).toBeGreaterThan(ordinary);
    expect(complex).toBeLessThanOrEqual(1800);
  });
});
