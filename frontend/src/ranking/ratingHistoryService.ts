import { RATING_HISTORY_LIMIT } from './rankConfig';
import type { RatingHistoryEntry } from './ratingTypes';

export function historyHasMatch(history: RatingHistoryEntry[], matchId: string): boolean {
  return history.some((entry) => entry.matchId === matchId);
}

export function prependHistory(
  history: RatingHistoryEntry[],
  entry: RatingHistoryEntry,
  limit: number = RATING_HISTORY_LIMIT,
): RatingHistoryEntry[] {
  if (historyHasMatch(history, entry.matchId)) return history;
  return [entry, ...history].slice(0, limit);
}

export function historyForGame(history: RatingHistoryEntry[], gameId: RatingHistoryEntry['gameId']): RatingHistoryEntry[] {
  return history.filter((entry) => entry.gameId === gameId);
}
