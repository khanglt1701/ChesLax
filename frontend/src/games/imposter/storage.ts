import type { Deal, ImposterMode, WinningSide } from './rules';

const KEY = 'cheslax_lite_imposter_session';

export type Phase = 'setup' | 'reveal' | 'play' | 'result';

export interface OfflineSession {
  phase: Phase;
  names: string[];
  mode: ImposterMode;
  imposterCount: number;
  undercoverCount: number;
  category: string;
  difficulty: 1 | 2 | 3 | null;
  deal: Deal | null;
  index: number;
  answerVisible: boolean;
  winner: WinningSide | null;
  timerEndsAt: number | null;
  recentWords: string[];
}

export function emptySession(): OfflineSession {
  return {
    phase: 'setup',
    names: ['', '', ''],
    mode: 'classic',
    imposterCount: 1,
    undercoverCount: 1,
    category: '',
    difficulty: null,
    deal: null,
    index: 0,
    answerVisible: false,
    winner: null,
    timerEndsAt: null,
    recentWords: [],
  };
}

export function loadSession(): OfflineSession {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return emptySession();
    const parsed = JSON.parse(raw) as Partial<OfflineSession>;
    const base = emptySession();
    return {
      ...base,
      ...parsed,
      names: Array.isArray(parsed.names) && parsed.names.length >= 3 ? parsed.names.map(String) : base.names,
      recentWords: Array.isArray(parsed.recentWords) ? parsed.recentWords.map(String).slice(0, 20) : [],
      deal: parsed.deal ?? null,
      index: Math.max(0, parsed.index ?? 0),
    };
  } catch {
    return emptySession();
  }
}

export function saveSession(session: OfflineSession): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Session storage can be unavailable in private mode.
  }
}
