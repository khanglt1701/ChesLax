import { WORD_PAIRS, type WordPair } from './words';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;

export type ImposterMode = 'classic' | 'undercover' | 'mrWhite';
export type ImposterRole = 'civilian' | 'imposter' | 'undercover' | 'mrWhite';
export type WinningSide = 'civilians' | 'imposters' | 'undercover' | 'mrWhite';

export interface RoleCounts {
  imposters: number;
  undercover: number;
  mrWhite: number;
}

export interface PlayerDeal {
  name: string;
  role: ImposterRole;
  word: string | null;
}

export interface Deal {
  players: PlayerDeal[];
  civilianWord: string;
  undercoverWord: string | null;
  category: string;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roleCounts(mode: ImposterMode, playerCount: number, imposters: number, undercover: number): RoleCounts {
  const count = clamp(playerCount, MIN_PLAYERS, MAX_PLAYERS);
  if (mode === 'undercover') {
    return { imposters: 0, mrWhite: 0, undercover: clamp(undercover, 1, Math.max(1, Math.floor((count - 1) / 2))) };
  }
  if (mode === 'mrWhite') {
    return {
      imposters: clamp(imposters, 0, Math.max(0, Math.floor((count - 2) / 2))),
      undercover: 0,
      mrWhite: 1,
    };
  }
  return {
    imposters: clamp(imposters, 1, Math.max(1, Math.floor((count - 1) / 2))),
    undercover: 0,
    mrWhite: 0,
  };
}

export function cleanNames(raw: string[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (let index = 0; index < raw.length; index += 1) {
    const typed = raw[index]?.trim().replace(/\s+/g, ' ') ?? '';
    const name = (typed.length >= 1 ? typed : `Người ${index + 1}`).slice(0, 16);
    const key = name.toLocaleLowerCase('vi');
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
    if (names.length === MAX_PLAYERS) break;
  }
  return names;
}

export function pickPair(recent: string[], category: string | null, difficulty: 1 | 2 | 3 | null, random: () => number): WordPair {
  const pool = WORD_PAIRS.filter((pair) => {
    if (category && pair.category !== category) return false;
    if (difficulty && pair.difficulty !== difficulty) return false;
    return true;
  });
  const source = pool.length > 0 ? pool : WORD_PAIRS;
  const fresh = source.filter((pair) => !recent.includes(pair.civilian));
  const choices = fresh.length > 0 ? fresh : source;
  const index = Math.min(choices.length - 1, Math.floor(random() * choices.length));
  return choices[index] ?? WORD_PAIRS[0];
}

export function dealGame(
  names: string[],
  mode: ImposterMode,
  imposters: number,
  undercover: number,
  category: string | null,
  difficulty: 1 | 2 | 3 | null,
  recent: string[],
  random: () => number = Math.random,
): Deal {
  const players = cleanNames(names);
  if (players.length < MIN_PLAYERS) {
    throw new Error('Cần từ 3 đến 12 người.');
  }
  const counts = roleCounts(mode, players.length, imposters, undercover);
  const pair = pickPair(recent, category, difficulty, random);
  const roles: ImposterRole[] = [
    ...Array.from({ length: counts.imposters }, () => 'imposter' as const),
    ...Array.from({ length: counts.undercover }, () => 'undercover' as const),
    ...Array.from({ length: counts.mrWhite }, () => 'mrWhite' as const),
  ];
  while (roles.length < players.length) roles.push('civilian');
  const shuffled = shuffle(roles, random);
  return {
    civilianWord: pair.civilian,
    undercoverWord: counts.undercover > 0 ? pair.undercover : null,
    category: pair.category,
    players: players.map((name, index) => ({
      name,
      role: shuffled[index] ?? 'civilian',
      word: wordFor(shuffled[index] ?? 'civilian', pair),
    })),
  };
}

export function wordFor(role: ImposterRole, pair: WordPair): string | null {
  if (role === 'civilian') return pair.civilian;
  if (role === 'undercover') return pair.undercover;
  return null;
}

export function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.min(index, Math.floor(random() * (index + 1)));
    const current = copy[index];
    copy[index] = copy[swap] as T;
    copy[swap] = current as T;
  }
  return copy;
}

export function roleLabel(role: ImposterRole): string {
  if (role === 'imposter') return 'Kẻ giả mạo';
  if (role === 'undercover') return 'Kẻ nội gián';
  if (role === 'mrWhite') return 'Ngài Trắng';
  return 'Dân thường';
}

export function sideLabel(side: WinningSide): string {
  if (side === 'imposters') return 'Kẻ giả mạo';
  if (side === 'undercover') return 'Kẻ nội gián';
  if (side === 'mrWhite') return 'Ngài Trắng';
  return 'Dân thường';
}

export function availableSides(mode: ImposterMode, counts: RoleCounts): WinningSide[] {
  const sides: WinningSide[] = ['civilians'];
  if (counts.imposters > 0) sides.push('imposters');
  if (mode === 'undercover') sides.push('undercover');
  if (counts.mrWhite > 0) sides.push('mrWhite');
  return sides;
}
