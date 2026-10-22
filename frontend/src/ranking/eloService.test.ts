import { describe, expect, it } from 'vitest';
import { computeEloChange, expectedScore, nextRating, ratingDelta } from './eloService';

describe('eloService', () => {
  it('gives a 50% expected score between equal ratings', () => {
    expect(expectedScore(1_000, 1_000)).toBeCloseTo(0.5);
  });

  it('awards +16 for a win against an equal opponent with K=32', () => {
    expect(ratingDelta(1_000, 1_000, 'win')).toBe(16);
    expect(nextRating(1_000, 1_000, 'win')).toBe(1_016);
  });

  it('subtracts 16 for a loss against an equal opponent', () => {
    expect(ratingDelta(1_000, 1_000, 'loss')).toBe(-16);
    expect(nextRating(1_000, 1_000, 'loss')).toBe(984);
  });

  it('leaves rating unchanged on a draw between equals', () => {
    expect(ratingDelta(1_000, 1_000, 'draw')).toBe(0);
    expect(nextRating(1_000, 1_000, 'draw')).toBe(1_000);
  });

  it('gives a low-rated player more points for beating a stronger opponent', () => {
    const upset = ratingDelta(1_000, 1_800, 'win');
    const even = ratingDelta(1_000, 1_000, 'win');
    expect(upset).toBeGreaterThan(even);
    expect(upset).toBeGreaterThan(25);
  });

  it('punishes a favorite more for losing to a weaker opponent', () => {
    const favoriteLoss = ratingDelta(1_800, 1_000, 'loss');
    const evenLoss = ratingDelta(1_000, 1_000, 'loss');
    expect(favoriteLoss).toBeLessThan(evenLoss);
  });

  it('never returns a negative rating', () => {
    expect(nextRating(10, 10, 'loss')).toBe(0);
  });

  it('returns a complete change payload', () => {
    const change = computeEloChange(1_000, 1_200, 'win');
    expect(change.oldRating).toBe(1_000);
    expect(change.newRating).toBe(change.oldRating + change.delta);
    expect(change.delta).toBeGreaterThan(0);
    expect(change.expected).toBeGreaterThan(0);
    expect(change.expected).toBeLessThan(0.5);
  });
});
