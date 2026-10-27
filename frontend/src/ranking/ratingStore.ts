import { create } from 'zustand';
import { readStorage, writeStorage } from '@/utils/storage';
import { AVATAR_IDS, applyAuthoritativeChange, applyRatedGame, createInitialRatingState } from './ratingEngine';
import type { ApplyRatedGameInput, PlayerRatingState, RatingChange, RatingRepository } from './ratingTypes';

const STORAGE_KEY = 'cheslax.rating';

export const localRatingRepository: RatingRepository = {
  load: () => readStorage<PlayerRatingState | null>(STORAGE_KEY, null),
  save: (state) => writeStorage(STORAGE_KEY, state),
};

function normalizeState(saved: PlayerRatingState | null): PlayerRatingState {
  const base = createInitialRatingState();
  if (!saved) return base;
  const avatarId = AVATAR_IDS.includes(saved.player?.avatarId as (typeof AVATAR_IDS)[number])
    ? saved.player.avatarId
    : base.player.avatarId;
  return {
    seasonId: saved.seasonId || base.seasonId,
    player: {
      id: base.player.id,
      name: saved.player?.name?.trim() ? saved.player.name.trim().slice(0, 24) : base.player.name,
      avatarId,
    },
    ratings: {
      chess: { ...base.ratings.chess, ...saved.ratings?.chess, gameId: 'chess' },
      'o-an-quan': { ...base.ratings['o-an-quan'], ...saved.ratings?.['o-an-quan'], gameId: 'o-an-quan' },
      caro: { ...base.ratings.caro, ...saved.ratings?.caro, gameId: 'caro' },
    },
    history: Array.isArray(saved.history) ? saved.history : [],
  };
}

function persist(state: PlayerRatingState): PlayerRatingState {
  localRatingRepository.save(state);
  return state;
}

interface RatingStore extends PlayerRatingState {
  applyMatch: (input: ApplyRatedGameInput) => RatingChange | null;
  ingestServerChange: (matchId: string, change: RatingChange) => RatingChange | null;
  updatePlayer: (patch: { name?: string; avatarId?: string }) => void;
  resetLocalRatings: () => void;
}

export const useRatingStore = create<RatingStore>((set, get) => ({
  ...normalizeState(localRatingRepository.load()),
  applyMatch: (input) => {
    const result = applyRatedGame(get(), input);
    if (!result.change) return null;
    persist(result.state);
    set({
      ratings: result.state.ratings,
      history: result.state.history,
    });
    return result.change;
  },
  ingestServerChange: (matchId, change) => {
    const result = applyAuthoritativeChange(get(), { matchId, change });
    if (!result.applied) return null;
    persist(result.state);
    set({
      ratings: result.state.ratings,
      history: result.state.history,
    });
    return change;
  },
  updatePlayer: (patch) => {
    const current = get();
    const name = patch.name?.trim() ? patch.name.trim().slice(0, 24) : current.player.name;
    const avatarId =
      patch.avatarId && AVATAR_IDS.includes(patch.avatarId as (typeof AVATAR_IDS)[number])
        ? patch.avatarId
        : current.player.avatarId;
    const next = persist({
      ...current,
      player: { ...current.player, name, avatarId },
    });
    set({ player: next.player });
  },
  resetLocalRatings: () => {
    const current = get();
    const next = persist({
      ...createInitialRatingState(),
      player: current.player,
    });
    set({
      seasonId: next.seasonId,
      ratings: next.ratings,
      history: next.history,
    });
  },
}));
