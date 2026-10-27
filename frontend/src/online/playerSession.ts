import { readStorage, writeStorage } from '@/utils/storage';

const STORAGE_KEY = 'cheslax.online.identity';

export interface OnlineIdentity {
  playerId: string;
  token: string;
}

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

export function loadOnlineIdentity(): OnlineIdentity {
  const saved = readStorage<Partial<OnlineIdentity> | null>(STORAGE_KEY, null);
  if (
    saved &&
    typeof saved.playerId === 'string' &&
    saved.playerId.length >= 8 &&
    typeof saved.token === 'string' &&
    saved.token.length >= 16
  ) {
    return { playerId: saved.playerId, token: saved.token };
  }
  const next: OnlineIdentity = {
    playerId: crypto.randomUUID(),
    token: randomToken(),
  };
  writeStorage(STORAGE_KEY, next);
  return next;
}

export function inviteUrl(code: string, game: 'chess' | 'o-an-quan' | 'caro' = 'chess'): string {
  return `${window.location.origin}/play/${game}/${code}`;
}
