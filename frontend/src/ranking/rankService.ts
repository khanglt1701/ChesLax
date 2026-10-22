import { MAX_RANK, RANKS, type RankDefinition } from './rankConfig';

export function sanitizeRating(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export function getRankByRating(rating: number): RankDefinition {
  const value = sanitizeRating(rating);
  let current = RANKS[0] ?? MAX_RANK;
  for (const rank of RANKS) {
    if (value >= rank.minRating) current = rank;
    else break;
  }
  return current;
}

export function getNextRank(rating: number): RankDefinition | null {
  const current = getRankByRating(rating);
  if (current.id === MAX_RANK.id) return null;
  return RANKS.find((rank) => rank.order === current.order + 1) ?? null;
}

export function getRatingToNextRank(rating: number): number {
  const value = sanitizeRating(rating);
  const next = getNextRank(value);
  if (!next) return 0;
  return Math.max(0, next.minRating - value);
}

export function getRatingProgress(rating: number): number {
  const value = sanitizeRating(rating);
  const current = getRankByRating(value);
  const next = getNextRank(value);
  if (!next) return 100;
  const span = next.minRating - current.minRating;
  if (span <= 0) return 100;
  const raw = ((value - current.minRating) / span) * 100;
  return Math.min(100, Math.max(0, raw));
}

export function formatRating(rating: number): string {
  return sanitizeRating(rating).toLocaleString('vi-VN');
}

export function isMaxRank(rating: number): boolean {
  return getRankByRating(rating).id === MAX_RANK.id;
}
