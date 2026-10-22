import type { RatedGameId } from '@/ranking/ratingTypes';
import { apiClient } from './apiClient';

export const LEADERBOARD_PAGE_SIZE = 8;

export interface LeaderboardEntryDto {
  rank: number;
  username: string;
  displayName: string;
  avatarId: string;
  rating: number;
  gamesPlayed: number;
}

export interface LeaderboardDto {
  gameId: RatedGameId;
  items: LeaderboardEntryDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  you: LeaderboardEntryDto | null;
}

export function getLeaderboard(gameId: RatedGameId, page = 1, pageSize = LEADERBOARD_PAGE_SIZE): Promise<LeaderboardDto> {
  const params = new URLSearchParams({
    game: gameId,
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiClient.get<LeaderboardDto>(`/api/leaderboard?${params.toString()}`);
}
