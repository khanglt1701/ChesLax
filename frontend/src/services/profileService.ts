import type { EloResult } from '@/ranking/eloService';
import type { RankId } from '@/ranking/rankConfig';
import { emptyGameRating } from '@/ranking/ratingEngine';
import type { PlayerGameRating, RatedGameId, RatingHistoryEntry } from '@/ranking/ratingTypes';
import { apiClient } from './apiClient';

export interface GameRatingDto {
  gameId: RatedGameId;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  highestRating: number;
  updatedAt: string | null;
}

export interface RatingHistoryDto {
  id: string;
  matchId: string;
  gameId: RatedGameId;
  at: string;
  oldRating: number;
  newRating: number;
  delta: number;
  oldRankId: RankId;
  newRankId: RankId;
  result: EloResult;
  opponentName: string;
  opponentRating: number;
}

export interface ProfileDto {
  username: string;
  displayName: string;
  avatarId: string;
  createdAt: string;
  ratings: GameRatingDto[];
  history: RatingHistoryDto[];
}

export interface UpdateProfilePayload {
  displayName: string;
  avatarId: string;
}

export function getMyProfile(): Promise<ProfileDto> {
  return apiClient.get<ProfileDto>('/api/users/me');
}

export function getPublicProfile(username: string): Promise<ProfileDto> {
  return apiClient.get<ProfileDto>(`/api/users/${encodeURIComponent(username)}`);
}

export function updateMyProfile(payload: UpdateProfilePayload): Promise<ProfileDto> {
  return apiClient.put<ProfileDto>('/api/users/me', payload);
}

export function mapProfileRatings(ratings: GameRatingDto[] | undefined): Record<RatedGameId, PlayerGameRating> {
  return {
    chess: toGameRating('chess', ratings?.find((rating) => rating.gameId === 'chess')),
    'o-an-quan': toGameRating('o-an-quan', ratings?.find((rating) => rating.gameId === 'o-an-quan')),
  };
}

export function mapProfileHistory(history: RatingHistoryDto[] | undefined): RatingHistoryEntry[] {
  return (history ?? []).map((entry) => ({
    id: entry.id,
    matchId: entry.matchId,
    gameId: entry.gameId,
    at: Date.parse(entry.at),
    oldRating: entry.oldRating,
    newRating: entry.newRating,
    delta: entry.delta,
    oldRankId: entry.oldRankId,
    newRankId: entry.newRankId,
    result: entry.result,
    opponentName: entry.opponentName,
    opponentRating: entry.opponentRating,
  }));
}

function toGameRating(gameId: RatedGameId, dto?: GameRatingDto): PlayerGameRating {
  if (!dto) return emptyGameRating(gameId);
  return {
    gameId,
    rating: dto.rating,
    wins: dto.wins,
    losses: dto.losses,
    draws: dto.draws,
    gamesPlayed: dto.gamesPlayed,
    highestRating: dto.highestRating,
    updatedAt: dto.updatedAt ? Date.parse(dto.updatedAt) : null,
  };
}
