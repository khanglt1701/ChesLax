import { describe, expect, it } from 'vitest';
import type { CoGanhMovePayload } from './protocol';

describe('online cờ gánh synchronization', () => {
  it('sends versioned moves without a local undo field', () => {
    const payload: CoGanhMovePayload = {
      code: 'ABCD',
      from: 22,
      to: 17,
      version: 2,
    };

    expect(payload.version).toBe(2);
    expect(payload).not.toHaveProperty('undo');
    expect(payload).not.toHaveProperty('redo');
  });
});
