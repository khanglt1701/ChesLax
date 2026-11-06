import { create } from 'zustand';
import { readStorage, writeStorage } from '@/utils/storage';

export interface GameStats {
  played: number;
  winsP1: number;
  winsP2: number;
  draws: number;
  lastPlayedAt: number | null;
}

export interface RecentGame {
  gameId: 'chess' | 'o-an-quan' | 'caro' | 'co-tuong' | 'co-ganh';
  gameName: string;
  result: string;
  at: number;
}

interface PersistedStats {
  chess: GameStats;
  oAnQuan: GameStats;
  caro: GameStats;
  coTuong: GameStats;
  coGanh: GameStats;
  recent: RecentGame[];
}

const STATS_KEY = 'cheslax.stats';

const emptyStats = (): GameStats => ({
  played: 0,
  winsP1: 0,
  winsP2: 0,
  draws: 0,
  lastPlayedAt: null,
});

const defaultStats = (): PersistedStats => ({
  chess: emptyStats(),
  oAnQuan: emptyStats(),
  caro: emptyStats(),
  coTuong: emptyStats(),
  coGanh: emptyStats(),
  recent: [],
});

function loadStats(): PersistedStats {
  const saved = readStorage<(Partial<PersistedStats> & { xiangqi?: GameStats; recent?: RecentGame[] }) | null>(STATS_KEY, null);
  if (!saved) return defaultStats();
  const recent = (saved.recent ?? []).filter((item) => (item.gameId as string) !== 'xiangqi');
  const next: PersistedStats = {
    chess: { ...emptyStats(), ...saved.chess },
    oAnQuan: { ...emptyStats(), ...saved.oAnQuan },
    caro: { ...emptyStats(), ...saved.caro },
    coTuong: { ...emptyStats(), ...saved.coTuong },
    coGanh: { ...emptyStats(), ...saved.coGanh },
    recent,
  };
  if (saved.xiangqi || recent.length !== (saved.recent ?? []).length) {
    writeStorage(STATS_KEY, next);
  }
  return next;
}

export type MatchOutcome = 'p1' | 'p2' | 'draw';

interface StatsState extends PersistedStats {
  recordResult: (gameId: 'chess' | 'o-an-quan' | 'caro' | 'co-tuong' | 'co-ganh', outcome: MatchOutcome, resultLabel: string) => void;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  ...loadStats(),
  recordResult: (gameId, outcome, resultLabel) => {
    const key =
      gameId === 'chess'
        ? 'chess'
        : gameId === 'caro'
          ? 'caro'
          : gameId === 'co-tuong'
            ? 'coTuong'
            : gameId === 'co-ganh'
              ? 'coGanh'
              : 'oAnQuan';
    const current = get()[key];
    const nextStats: GameStats = {
      played: current.played + 1,
      winsP1: current.winsP1 + (outcome === 'p1' ? 1 : 0),
      winsP2: current.winsP2 + (outcome === 'p2' ? 1 : 0),
      draws: current.draws + (outcome === 'draw' ? 1 : 0),
      lastPlayedAt: Date.now(),
    };
    const recent: RecentGame[] = [
      {
        gameId,
        gameName:
          gameId === 'chess'
            ? 'Cờ vua'
            : gameId === 'caro'
              ? 'Caro'
              : gameId === 'co-tuong'
                ? 'Cờ tướng'
                : gameId === 'co-ganh'
                  ? 'Cờ Gánh'
                  : 'Ô ăn quan',
        result: resultLabel,
        at: Date.now(),
      },
      ...get().recent,
    ].slice(0, 8);

    const next = { ...get(), [key]: nextStats, recent };
    writeStorage(STATS_KEY, {
      chess: next.chess,
      oAnQuan: next.oAnQuan,
      caro: next.caro,
      coTuong: next.coTuong,
      coGanh: next.coGanh,
      recent: next.recent,
    });
    set({ [key]: nextStats, recent });
  },
}));
