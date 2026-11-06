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
  gameId: 'chess' | 'o-an-quan' | 'caro' | 'xiangqi' | 'co-ganh';
  gameName: string;
  result: string;
  at: number;
}

interface PersistedStats {
  chess: GameStats;
  oAnQuan: GameStats;
  caro: GameStats;
  xiangqi: GameStats;
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
  xiangqi: emptyStats(),
  coGanh: emptyStats(),
  recent: [],
});

function loadStats(): PersistedStats {
  const saved = readStorage<PersistedStats | null>(STATS_KEY, null);
  if (!saved) return defaultStats();
  return {
    chess: { ...emptyStats(), ...saved.chess },
    oAnQuan: { ...emptyStats(), ...saved.oAnQuan },
    caro: { ...emptyStats(), ...saved.caro },
    xiangqi: { ...emptyStats(), ...saved.xiangqi },
    coGanh: { ...emptyStats(), ...saved.coGanh },
    recent: saved.recent ?? [],
  };
}

export type MatchOutcome = 'p1' | 'p2' | 'draw';

interface StatsState extends PersistedStats {
  recordResult: (gameId: 'chess' | 'o-an-quan' | 'caro' | 'xiangqi' | 'co-ganh', outcome: MatchOutcome, resultLabel: string) => void;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  ...loadStats(),
  recordResult: (gameId, outcome, resultLabel) => {
    const key =
      gameId === 'chess'
        ? 'chess'
        : gameId === 'caro'
          ? 'caro'
          : gameId === 'xiangqi'
            ? 'xiangqi'
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
              : gameId === 'xiangqi'
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
      xiangqi: next.xiangqi,
      coGanh: next.coGanh,
      recent: next.recent,
    });
    set({ [key]: nextStats, recent });
  },
}));
