import { ELO_K_FACTOR } from './rankConfig';
import { sanitizeRating } from './rankService';

export type EloResult = 'win' | 'loss' | 'draw';

export const ELO_SCORE: Record<EloResult, number> = {
  win: 1,
  loss: 0,
  draw: 0.5,
};

export function expectedScore(playerRating: number, opponentRating: number): number {
  const player = sanitizeRating(playerRating);
  const opponent = sanitizeRating(opponentRating);
  return 1 / (1 + 10 ** ((opponent - player) / 400));
}

export function ratingDelta(
  playerRating: number,
  opponentRating: number,
  result: EloResult,
  kFactor: number = ELO_K_FACTOR,
): number {
  const actual = ELO_SCORE[result];
  const expected = expectedScore(playerRating, opponentRating);
  return Math.round(kFactor * (actual - expected));
}

export function nextRating(
  playerRating: number,
  opponentRating: number,
  result: EloResult,
  kFactor: number = ELO_K_FACTOR,
): number {
  return Math.max(0, sanitizeRating(playerRating) + ratingDelta(playerRating, opponentRating, result, kFactor));
}

export function computeEloChange(
  playerRating: number,
  opponentRating: number,
  result: EloResult,
  kFactor: number = ELO_K_FACTOR,
): { oldRating: number; newRating: number; delta: number; expected: number } {
  const oldRating = sanitizeRating(playerRating);
  const delta = ratingDelta(oldRating, opponentRating, result, kFactor);
  const newRating = Math.max(0, oldRating + delta);
  return {
    oldRating,
    newRating,
    delta,
    expected: expectedScore(oldRating, opponentRating),
  };
}
