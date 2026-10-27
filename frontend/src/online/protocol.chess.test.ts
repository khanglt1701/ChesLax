import { describe, expect, it } from 'vitest';
import type { ChessMovePayload } from './protocol';

describe('online chess synchronization', () => {
  it('sends versioned moves without a local undo field', () => {
    const payload: ChessMovePayload = {
      code: 'ABCD',
      from: 'e2',
      to: 'e4',
      version: 4,
    };

    expect(payload.version).toBe(4);
    expect(payload).not.toHaveProperty('undo');
    expect(payload).not.toHaveProperty('redo');
  });
});
