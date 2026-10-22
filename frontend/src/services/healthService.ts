import { apiClient } from './apiClient';

export interface HealthStatus {
  ok: boolean;
  status: string;
  databaseProvider: string;
  database: string;
  rankCount: number;
  startingRating: number;
}

export function getApiHealth(): Promise<HealthStatus> {
  return apiClient.get<HealthStatus>('/api/health');
}
