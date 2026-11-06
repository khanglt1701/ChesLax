import { describe, expect, it } from 'vitest';
import { cleanNames, dealGame, roleCounts } from './rules';

const steady = () => 0.999;

describe('phát từ trên một máy', () => {
  it('cho dân thường cùng một từ và kẻ giả mạo không có từ', () => {
    const deal = dealGame(['An', 'Bình', 'Chi'], 'classic', 1, 0, 'animals', 1, [], steady);
    const imposters = deal.players.filter((player) => player.role === 'imposter');
    const civilians = deal.players.filter((player) => player.role === 'civilian');
    expect(imposters).toHaveLength(1);
    expect(imposters[0]?.word).toBeNull();
    expect(civilians.every((player) => player.word === deal.civilianWord)).toBe(true);
    expect(deal.civilianWord).toBe('Gà');
  });

  it('cho kẻ nội gián một từ khác', () => {
    const deal = dealGame(['An', 'Bình', 'Chi', 'Dũng'], 'undercover', 0, 1, 'food', 1, [], steady);
    const insider = deal.players.find((player) => player.role === 'undercover');
    expect(insider?.word).toBe(deal.undercoverWord);
    expect(insider?.word).not.toBe(deal.civilianWord);
  });

  it('không để số vai đặc biệt bằng hoặc hơn dân thường', () => {
    expect(roleCounts('classic', 3, 5, 0).imposters).toBe(1);
    expect(roleCounts('mrWhite', 4, 9, 0)).toEqual({ imposters: 1, undercover: 0, mrWhite: 1 });
  });

  it('lấy chữ gợi ý khi tên để trống', () => {
    expect(cleanNames(['', 'Bình', '  '])).toEqual(['Người 1', 'Bình', 'Người 3']);
  });

  it('tránh từ vừa dùng', () => {
    const deal = dealGame(['An', 'Bình', 'Chi'], 'classic', 1, 0, 'animals', 1, ['Mèo'], steady);
    expect(deal.civilianWord).not.toBe('Mèo');
  });
});
