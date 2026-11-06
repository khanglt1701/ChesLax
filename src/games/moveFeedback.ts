import { useEffect, useRef, useState } from 'react';

export type MoveFeedback = 'none' | 'capture' | 'check';

export const CAPTURE_VIBRATION = 45;
export const CHECK_VIBRATION = [40, 50, 90, 40, 130];

export function isMobilePlay(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
}

export function feedbackForMove(input: { captured: boolean; check: boolean; mobile: boolean }): MoveFeedback {
  if (!input.mobile) return 'none';
  if (input.check) return 'check';
  if (input.captured) return 'capture';
  return 'none';
}

export function vibrateFor(kind: MoveFeedback): void {
  if (kind === 'none' || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(kind === 'check' ? CHECK_VIBRATION : CAPTURE_VIBRATION);
}

/** Fires once each time `token` increases. Going backward (undo, new game) stays quiet. */
export function useMoveFeedback(token: number, captured: boolean, check: boolean): number {
  const seen = useRef<number | null>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (seen.current === null) {
      seen.current = token;
      return;
    }
    if (token === seen.current) return;
    const forward = token > seen.current;
    seen.current = token;
    if (!forward) return;
    vibrateFor(feedbackForMove({ captured, check, mobile: isMobilePlay() }));
    if (check) setPulse((value) => value + 1);
  }, [token, captured, check]);

  return pulse;
}
