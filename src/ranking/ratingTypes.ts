import type { EloResult } from './eloService';
import type { RankId } from './rankConfig';

export type RatedGameId = 'chess' | 'o-an-quan';

export interface PlayerGameRating {
  gameId: RatedGameId;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  highestRating: number;
  updatedAt: number | null;
}

export interface PlayerProfileData {
  id: string;
  name: string;
  avatarId: string;
}

export interface RatingHistoryEntry {
  id: string;
  matchId: string;
  gameId: RatedGameId;
  at: number;
  oldRating: number;
  newRating: number;
  delta: number;
  oldRankId: RankId;
  newRankId: RankId;
  result: EloResult;
  opponentName: string;
  opponentRating: number;
}

export interface RatingChange {
  gameId: RatedGameId;
  result: EloResult;
  oldRating: number;
  newRating: number;
  delta: number;
  oldRankId: RankId;
  newRankId: RankId;
  promoted: boolean;
  demoted: boolean;
  reachedMaxRank: boolean;
  opponentName: string;
  opponentRating: number;
}

export interface ApplyRatedGameInput {
  matchId: string;
  gameId: RatedGameId;
  finished: boolean;
  rated: boolean;
  result: EloResult;
  opponentRating: number;
  opponentName: string;
  at?: number;
}

export interface PlayerRatingState {
  seasonId: string;
  player: PlayerProfileData;
  ratings: Record<RatedGameId, PlayerGameRating>;
  history: RatingHistoryEntry[];
}

export interface RatingRepository {
  load(): PlayerRatingState | null;
  save(state: PlayerRatingState): void;
}
