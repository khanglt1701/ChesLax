export const STORAGE_PREFIX = 'cheslax_lite_';

export function storageKey(name: string): string {
  return `${STORAGE_PREFIX}${name}`;
}

function storageAvailable(): boolean {
  return typeof localStorage !== 'undefined';
}

export function readStorage<T>(key: string, fallback: T): T {
  if (!storageAvailable()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    if (parsed === null || parsed === undefined) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  if (!storageAvailable()) return;
  try {
    const next = JSON.stringify(value);
    if (localStorage.getItem(key) === next) return;
    localStorage.setItem(key, next);
  } catch {
    // Ignore quota, private mode, and disabled storage.
  }
}
