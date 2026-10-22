import { describe, expect, it } from 'vitest';
import { RANKS } from './rankConfig';
import {
  getNextRank,
  getRankByRating,
  getRatingProgress,
  getRatingToNextRank,
  isMaxRank,
  sanitizeRating,
} from './rankService';

describe('rankService', () => {
  it('maps every published threshold to the expected rank', () => {
    expect(getRankByRating(0).name).toBe('Tập Sự');
    expect(getRankByRating(599).name).toBe('Tập Sự');
    expect(getRankByRating(600).name).toBe('Nhập Môn');
    expect(getRankByRating(799).name).toBe('Nhập Môn');
    expect(getRankByRating(800).name).toBe('Học Kỳ');
    expect(getRankByRating(1_000).name).toBe('Kỳ Đồ');
    expect(getRankByRating(1_200).name).toBe('Kỳ Sĩ');
    expect(getRankByRating(1_600).name).toBe('Kỳ Sư');
    expect(getRankByRating(1_800).name).toBe('Cao Thủ');
    expect(getRankByRating(2_000).name).toBe('Đại Sư');
    expect(getRankByRating(3_199).name).toBe('Kỳ Đế');
    expect(getRankByRating(3_200).name).toBe('Kỳ Thánh');
    expect(getRankByRating(9_999).name).toBe('Kỳ Thánh');
  });

  it('treats negative and invalid ratings as Tập Sự safely', () => {
    expect(sanitizeRating(-40)).toBe(0);
    expect(sanitizeRating(Number.NaN)).toBe(0);
    expect(sanitizeRating(Number.POSITIVE_INFINITY)).toBe(0);
    expect(getRankByRating(-12).name).toBe('Tập Sự');
    expect(getRankByRating(Number.NaN).name).toBe('Tập Sự');
  });

  it('returns 75% progress for 1750 inside Kỳ Sư', () => {
    expect(getRankByRating(1_750).name).toBe('Kỳ Sư');
    expect(getNextRank(1_750)?.name).toBe('Cao Thủ');
    expect(getRatingToNextRank(1_750)).toBe(50);
    expect(getRatingProgress(1_750)).toBe(75);
  });

  it('has no next rank at Kỳ Thánh', () => {
    expect(getNextRank(3_200)).toBeNull();
    expect(getRatingToNextRank(3_200)).toBe(0);
    expect(getRatingProgress(3_200)).toBe(100);
    expect(isMaxRank(3_200)).toBe(true);
  });

  it('keeps progress between 0 and 100 while climbing a rank', () => {
    expect(getRatingProgress(1_600)).toBe(0);
    expect(getRatingProgress(1_799)).toBeGreaterThan(99);
    expect(getRatingProgress(1_799)).toBeLessThan(100);
    expect(getRatingProgress(1_800)).toBe(0);
  });

  it('exposes 15 ranks in order without duplicate names', () => {
    expect(RANKS).toHaveLength(15);
    expect(new Set(RANKS.map((rank) => rank.name)).size).toBe(15);
    expect(RANKS.map((rank) => rank.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  });
});
