import { describe, expect, it } from 'vitest';
import { normalizeTimeControlId, parseTimeControlBudgetMs } from './protocol';

describe('time control ids', () => {
  it('normalizes legacy lobby values to API ids', () => {
    expect(normalizeTimeControlId('5m')).toBe('5+0');
    expect(normalizeTimeControlId('10m')).toBe('10+0');
    expect(normalizeTimeControlId('off')).toBe('off');
    expect(normalizeTimeControlId('3+2')).toBe('3+2');
  });

  it('parses a millisecond budget from API and legacy ids', () => {
    expect(parseTimeControlBudgetMs('off')).toBe(0);
    expect(parseTimeControlBudgetMs('5m')).toBe(5 * 60 * 1000);
    expect(parseTimeControlBudgetMs('5+0')).toBe(5 * 60 * 1000);
    expect(parseTimeControlBudgetMs('3+2')).toBe(3 * 60 * 1000);
  });
});
