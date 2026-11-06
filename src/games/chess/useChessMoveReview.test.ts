import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useChessMoveReview } from './useChessMoveReview';

describe('chess move review', () => {
  it('steps back one ply at a time and cannot play until returning to the live position', () => {
    const { result } = renderHook(() => useChessMoveReview(2));

    expect(result.current.ply).toBe(2);
    expect(result.current.reviewing).toBe(false);

    act(() => result.current.goPrev());
    expect(result.current.ply).toBe(1);
    expect(result.current.reviewing).toBe(true);

    act(() => result.current.goPrev());
    expect(result.current.ply).toBe(0);
    expect(result.current.reviewing).toBe(true);

    act(() => result.current.goPrev());
    expect(result.current.ply).toBe(0);

    act(() => result.current.goNext());
    expect(result.current.ply).toBe(1);
    expect(result.current.reviewing).toBe(true);

    act(() => result.current.goNext());
    expect(result.current.ply).toBe(2);
    expect(result.current.reviewing).toBe(false);
  });

  it('returns to the live position in one step', () => {
    const { result } = renderHook(() => useChessMoveReview(4));
    act(() => result.current.goPrev());
    act(() => result.current.goPrev());
    expect(result.current.reviewing).toBe(true);
    act(() => result.current.goLast());
    expect(result.current.reviewing).toBe(false);
    expect(result.current.ply).toBe(4);
  });
});
