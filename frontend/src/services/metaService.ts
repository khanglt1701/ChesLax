import { apiClient } from './apiClient';

export interface RankDto {
  id: string;
  level: number;
  name: string;
  minRating: number;
  maxRating: number | null;
}

export interface TimeControlDto {
  id: string;
  label: string;
  baseSeconds: number;
  incrementSeconds: number;
}

export function getMetaGames(): Promise<string[]> {
  return apiClient.get<string[]>('/api/meta/games');
}

export function getMetaRanks(): Promise<RankDto[]> {
  return apiClient.get<RankDto[]>('/api/meta/ranks');
}

export function getMetaTimeControls(): Promise<TimeControlDto[]> {
  return apiClient.get<TimeControlDto[]>('/api/meta/time-controls');
}
