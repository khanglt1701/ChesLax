import { useState } from 'react';

export function useChessMoveReview(livePly: number) {
  const [pinned, setPinned] = useState<number | null>(null);
  const ply = pinned === null ? livePly : Math.min(pinned, livePly);
  const reviewing = ply < livePly;

  function setPly(next: number) {
    setPinned(next >= livePly ? null : next);
  }

  return {
    ply,
    reviewing,
    setPly,
    goFirst: () => setPinned(livePly === 0 ? null : 0),
    goPrev: () => setPinned((current) => {
      const from = current === null ? livePly : current;
      const next = Math.max(0, from - 1);
      return next >= livePly ? null : next;
    }),
    goNext: () => setPinned((current) => {
      const from = current === null ? livePly : current;
      const next = Math.min(livePly, from + 1);
      return next >= livePly ? null : next;
    }),
    goLast: () => setPinned(null),
  };
}
