import { describe, expect, it } from 'vitest';
import { generateRoomCode, isPlausibleRoomCode, normalizeRoomCode } from './roomCode';

describe('room codes', () => {
  it('normalizes and validates invite codes', () => {
    expect(normalizeRoomCode(' ab-23cd ')).toBe('AB23CD');
    expect(isPlausibleRoomCode('AB23CD')).toBe(true);
    expect(isPlausibleRoomCode('O0I1ZZ')).toBe(false);
    expect(isPlausibleRoomCode('SHORT')).toBe(false);
  });

  it('generates unique codes', () => {
    const used = new Set<string>();
    for (let i = 0; i < 40; i += 1) {
      const code = generateRoomCode((value) => used.has(value));
      expect(isPlausibleRoomCode(code)).toBe(true);
      used.add(code);
    }
    expect(used.size).toBe(40);
  });
});
