import { describe, expect, it } from 'vitest';
import { TIME_CONTROL_PRESETS, timeControlPresetsFromApi } from './chessClock';

describe('timeControlPresetsFromApi', () => {
  it('maps API seconds into local clock presets', () => {
    const presets = timeControlPresetsFromApi([
      { id: 'off', label: 'Không giới hạn', baseSeconds: 0, incrementSeconds: 0 },
      { id: '3+2', label: '3+2', baseSeconds: 180, incrementSeconds: 2 },
    ]);
    expect(presets).toEqual([
      { id: 'off', label: 'Không giới hạn', gameTimeMs: 0, incrementMs: 0 },
      { id: '3+2', label: '3+2', gameTimeMs: 180_000, incrementMs: 2_000 },
    ]);
  });

  it('falls back to local presets when the API list is empty', () => {
    expect(timeControlPresetsFromApi([])).toEqual(TIME_CONTROL_PRESETS);
  });
});
