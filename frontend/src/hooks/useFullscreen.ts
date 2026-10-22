import { useCallback, useEffect, useState, type RefObject } from 'react';

export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [native, setNative] = useState(false);
  const [fallback, setFallback] = useState(false);
  const active = native || fallback;

  useEffect(() => {
    const sync = () => {
      setNative(document.fullscreenElement === ref.current);
    };
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, [ref]);

  useEffect(() => {
    if (!fallback) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFallback(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fallback]);

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', active);
    return () => document.body.classList.remove('overflow-hidden');
  }, [active]);

  const toggle = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setFallback(false);
      return;
    }
    if (fallback) {
      setFallback(false);
      return;
    }
    const element = ref.current;
    if (!element) return;
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
        return;
      }
    } catch {
      setFallback(true);
      return;
    }
    setFallback(true);
  }, [fallback, ref]);

  return { active, fallback, toggle };
}
