import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CAPTURE_VIBRATION,
  CHECK_VIBRATION,
  feedbackForMove,
  useMoveFeedback,
} from './moveFeedback';

describe('feedbackForMove', () => {
  it('stays quiet away from the mobile layout', () => {
    expect(feedbackForMove({ captured: true, check: true, mobile: false })).toBe('none');
  });

  it('vibrates a capture and prefers check when both happen', () => {
    expect(feedbackForMove({ captured: true, check: false, mobile: true })).toBe('capture');
    expect(feedbackForMove({ captured: true, check: true, mobile: true })).toBe('check');
    expect(feedbackForMove({ captured: false, check: false, mobile: true })).toBe('none');
  });
});

describe('useMoveFeedback', () => {
  const vibrate = vi.fn();
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    vibrate.mockReset();
    window.matchMedia = originalMatchMedia;
    vi.unstubAllGlobals();
  });

  it('buzzes only when a later live move captures or gives check', () => {
    vi.stubGlobal('navigator', { vibrate });
    const { result, rerender } = renderHook(
      ({ token, captured, check }: { token: number; captured: boolean; check: boolean }) =>
        useMoveFeedback(token, captured, check),
      { initialProps: { token: 2, captured: false, check: true } },
    );

    expect(vibrate).not.toHaveBeenCalled();
    expect(result.current).toBe(0);

    rerender({ token: 3, captured: true, check: false });
    expect(vibrate).toHaveBeenLastCalledWith(CAPTURE_VIBRATION);
    expect(result.current).toBe(0);

    rerender({ token: 4, captured: false, check: true });
    expect(vibrate).toHaveBeenLastCalledWith(CHECK_VIBRATION);
    expect(result.current).toBe(1);

    rerender({ token: 1, captured: true, check: true });
    expect(vibrate).toHaveBeenCalledTimes(2);
  });

  it('does not buzz a quiet move or a desktop window, but still flashes check', () => {
    vi.stubGlobal('navigator', { vibrate });
    const { result, rerender } = renderHook(
      ({ token, captured, check }: { token: number; captured: boolean; check: boolean }) =>
        useMoveFeedback(token, captured, check),
      { initialProps: { token: 0, captured: false, check: false } },
    );

    rerender({ token: 1, captured: false, check: false });
    expect(vibrate).not.toHaveBeenCalled();

    window.matchMedia = () =>
      ({
        matches: false,
        media: '',
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {
          return false;
        },
      }) as MediaQueryList;

    rerender({ token: 2, captured: true, check: true });
    expect(vibrate).not.toHaveBeenCalled();
    expect(result.current).toBe(1);
  });
});
