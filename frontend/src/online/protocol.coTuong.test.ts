import { describe, expect, it } from 'vitest';
import type { CoTuongMovePayload } from './protocol';

describe('online coTuong synchronization', () => {
  it('sends versioned moves without a local undo field', () => {
    const payload: CoTuongMovePayload = {
      code: 'ABCD',
      from: 'a3',
      to: 'a4',
      version: 2,
    };

    expect(payload.version).toBe(2);
    expect(payload).not.toHaveProperty('undo');
    expect(payload).not.toHaveProperty('redo');
  });
});
