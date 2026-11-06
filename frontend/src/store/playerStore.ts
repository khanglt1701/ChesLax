import { create } from 'zustand';
import { readStorage, storageKey, writeStorage } from '@/utils/storage';

export interface LocalPlayers {
  player1: string;
  player2: string;
}

export const DEFAULT_PLAYERS: LocalPlayers = {
  player1: 'Người chơi 1',
  player2: 'Người chơi 2',
};

const PLAYERS_KEY = storageKey('players');
const MAX_NAME = 24;

export function shownName(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed || fallback;
}

export function parsePlayers(value: unknown): LocalPlayers {
  if (!value || typeof value !== 'object') return { ...DEFAULT_PLAYERS };
  const record = value as Partial<LocalPlayers>;
  return {
    player1: clipName(record.player1, DEFAULT_PLAYERS.player1),
    player2: clipName(record.player2, DEFAULT_PLAYERS.player2),
  };
}

function clipName(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  return value.slice(0, MAX_NAME);
}

interface PlayerState {
  players: LocalPlayers;
  setPlayer: (slot: keyof LocalPlayers, name: string) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  players: parsePlayers(readStorage<unknown>(PLAYERS_KEY, null)),
  setPlayer: (slot, name) => {
    const players = { ...get().players, [slot]: clipName(name, '') };
    writeStorage(PLAYERS_KEY, players);
    set({ players });
  },
}));
