import { computeEloChange } from './eloService';
import { CURRENT_SEASON_ID, STARTING_RATING } from './rankConfig';
import { getRankByRating, isMaxRank, sanitizeRating } from './rankService';
import { historyHasMatch, prependHistory } from './ratingHistoryService';
import type {
  ApplyRatedGameInput,
  PlayerGameRating,
  PlayerProfileData,
  PlayerRatingState,
  RatedGameId,
  RatingChange,
} from './ratingTypes';

export const LOCAL_PLAYER_ID = 'local-player';

export const AVATAR_IDS = ['seal-1', 'seal-2', 'seal-3', 'seal-4', 'seal-5', 'seal-6', 'seal-7', 'seal-8'] as const;

export function emptyGameRating(gameId: RatedGameId): PlayerGameRating {
  return {
    gameId,
    rating: STARTING_RATING,
    wins: 0,
    losses: 0,
    draws: 0,
    gamesPlayed: 0,
    highestRating: STARTING_RATING,
    updatedAt: null,
  };
}

export function defaultPlayer(): PlayerProfileData {
  return {
    id: LOCAL_PLAYER_ID,
    name: 'Kỳ thủ Cheslax',
    avatarId: 'seal-1',
  };
}

export function createInitialRatingState(): PlayerRatingState {
  return {
    seasonId: CURRENT_SEASON_ID,
    player: defaultPlayer(),
    ratings: {
      chess: emptyGameRating('chess'),
      'o-an-quan': emptyGameRating('o-an-quan'),
    },
    history: [],
  };
}

export function canApplyRatedGame(input: ApplyRatedGameInput): boolean {
  if (!input.finished || !input.rated) return false;
  if (!input.matchId.trim()) return false;
  return input.result === 'win' || input.result === 'loss' || input.result === 'draw';
}

export function applyRatedGame(
  state: PlayerRatingState,
  input: ApplyRatedGameInput,
): { state: PlayerRatingState; change: RatingChange | null } {
  if (!canApplyRatedGame(input)) return { state, change: null };
  if (historyHasMatch(state.history, input.matchId)) return { state, change: null };

  const current = state.ratings[input.gameId];
  const elo = computeEloChange(current.rating, input.opponentRating, input.result);
  const oldRank = getRankByRating(current.rating);
  const newRank = getRankByRating(elo.newRating);
  const at = input.at ?? Date.now();

  const nextRating: PlayerGameRating = {
    ...current,
    rating: elo.newRating,
    wins: current.wins + (input.result === 'win' ? 1 : 0),
    losses: current.losses + (input.result === 'loss' ? 1 : 0),
    draws: current.draws + (input.result === 'draw' ? 1 : 0),
    gamesPlayed: current.gamesPlayed + 1,
    highestRating: Math.max(current.highestRating, elo.newRating),
    updatedAt: at,
  };

  const change: RatingChange = {
    gameId: input.gameId,
    result: input.result,
    oldRating: elo.oldRating,
    newRating: elo.newRating,
    delta: elo.delta,
    oldRankId: oldRank.id,
    newRankId: newRank.id,
    promoted: newRank.order > oldRank.order,
    demoted: newRank.order < oldRank.order,
    reachedMaxRank: isMaxRank(elo.newRating) && oldRank.id !== newRank.id,
    opponentName: input.opponentName,
    opponentRating: sanitizeRating(input.opponentRating),
  };

  const nextState: PlayerRatingState = {
    ...state,
    ratings: {
      ...state.ratings,
      [input.gameId]: nextRating,
    },
    history: prependHistory(state.history, {
      id: input.matchId,
      matchId: input.matchId,
      gameId: input.gameId,
      at,
      oldRating: elo.oldRating,
      newRating: elo.newRating,
      delta: elo.delta,
      oldRankId: oldRank.id,
      newRankId: newRank.id,
      result: input.result,
      opponentName: input.opponentName,
      opponentRating: sanitizeRating(input.opponentRating),
    }),
  };

  return { state: nextState, change };
}

export function applyAuthoritativeChange(
  state: PlayerRatingState,
  input: { matchId: string; change: RatingChange; at?: number },
): { state: PlayerRatingState; applied: boolean } {
  if (!input.matchId.trim()) return { state, applied: false };
  if (historyHasMatch(state.history, input.matchId)) return { state, applied: false };

  const current = state.ratings[input.change.gameId];
  const at = input.at ?? Date.now();
  const nextRating: PlayerGameRating = {
    ...current,
    rating: sanitizeRating(input.change.newRating),
    wins: current.wins + (input.change.result === 'win' ? 1 : 0),
    losses: current.losses + (input.change.result === 'loss' ? 1 : 0),
    draws: current.draws + (input.change.result === 'draw' ? 1 : 0),
    gamesPlayed: current.gamesPlayed + 1,
    highestRating: Math.max(current.highestRating, sanitizeRating(input.change.newRating)),
    updatedAt: at,
  };

  return {
    applied: true,
    state: {
      ...state,
      ratings: {
        ...state.ratings,
        [input.change.gameId]: nextRating,
      },
      history: prependHistory(state.history, {
        id: input.matchId,
        matchId: input.matchId,
        gameId: input.change.gameId,
        at,
        oldRating: input.change.oldRating,
        newRating: input.change.newRating,
        delta: input.change.delta,
        oldRankId: input.change.oldRankId,
        newRankId: input.change.newRankId,
        result: input.change.result,
        opponentName: input.change.opponentName,
        opponentRating: input.change.opponentRating,
      }),
    },
  };
}

export function winRate(rating: PlayerGameRating): number {
  if (rating.gamesPlayed === 0) return 0;
  return (rating.wins / rating.gamesPlayed) * 100;
}

export function featuredGameRating(ratings: PlayerRatingState['ratings']): PlayerGameRating {
  return ratings.chess.rating >= ratings['o-an-quan'].rating ? ratings.chess : ratings['o-an-quan'];
}

export function highlightRank(state: PlayerRatingState): PlayerGameRating {
  return featuredGameRating(state.ratings);
}
