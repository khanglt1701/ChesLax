import { afterEach, describe, expect, it } from 'vitest';
import { readStorage, storageKey, writeStorage } from './storage';

describe('local storage', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('prefixes keys and returns defaults for missing or corrupt data', () => {
    const key = storageKey('sample');
    expect(key).toBe('cheslax_lite_sample');
    expect(readStorage(key, { ok: true })).toEqual({ ok: true });

    localStorage.setItem(key, '{not json');
    expect(readStorage(key, 4)).toBe(4);
  });

  it('skips a write when the stored value is unchanged', () => {
    const key = storageKey('sample');
    writeStorage(key, { name: 'An' });
    const first = localStorage.getItem(key);
    writeStorage(key, { name: 'An' });
    expect(localStorage.getItem(key)).toBe(first);
    writeStorage(key, { name: 'Bình' });
    expect(localStorage.getItem(key)).not.toBe(first);
  });

  it('keeps working when localStorage throws', () => {
    const key = storageKey('blocked');
    const setItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = () => {
      throw new Error('denied');
    };
    expect(() => writeStorage(key, 1)).not.toThrow();
    localStorage.setItem = setItem;
    localStorage.setItem(key, '{');
    expect(readStorage(key, 'fallback')).toBe('fallback');
  });
});
