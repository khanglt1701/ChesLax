import { apiClient } from './apiClient';

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
}

export interface AdminOverview {
  registeredUsers: number;
  guestUsers: number;
  botUsers: number;
  lockedUsers: number;
  totalMatches: number;
  finishedMatches: number;
  matchesToday: number;
  waitingRooms: number;
  playingRooms: number;
  queuedTickets: number;
  generatedAt: string;
  recentMatches: AdminMatchRow[];
}

export interface AdminUserRow {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarId: string;
  createdAt: string;
  lastSeenAt: string | null;
  isGuest: boolean;
  isBot: boolean;
  isLocked: boolean;
  roles: string[];
  chessRating: number;
  oAnQuanRating: number;
}

export interface AdminUserRating {
  gameId: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  highestRating: number;
  updatedAt: string | null;
}

export interface AdminUserDetail {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarId: string;
  createdAt: string;
  lastSeenAt: string | null;
  isGuest: boolean;
  isBot: boolean;
  isLocked: boolean;
  lockoutEnd: string | null;
  roles: string[];
  ratings: AdminUserRating[];
}

export interface AdminMatchRow {
  id: string;
  roomId: string;
  roomCode: string;
  gameId: string;
  mode: string;
  status: string;
  rated: boolean;
  player1Username: string;
  player2Username: string;
  opponentType: string;
  outcome: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface AdminRoomRow {
  id: string;
  code: string;
  gameId: string;
  mode: string;
  status: string;
  rated: boolean;
  seatCount: number;
  hostUsername: string;
  createdAt: string;
  lastActivityAt: string;
}

export type AdminUserKind = 'registered' | 'guest' | 'bot' | 'locked' | 'all';

export function getAdminOverview(): Promise<AdminOverview> {
  return apiClient.get<AdminOverview>('/api/admin/overview');
}

export function getAdminUsers(params: {
  q?: string;
  kind?: AdminUserKind;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<AdminUserRow>> {
  const query = new URLSearchParams();
  if (params.q?.trim()) query.set('q', params.q.trim());
  if (params.kind) query.set('kind', params.kind);
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 20));
  return apiClient.get<PagedResult<AdminUserRow>>(`/api/admin/users?${query}`);
}

export function getAdminUser(userId: string): Promise<AdminUserDetail> {
  return apiClient.get<AdminUserDetail>(`/api/admin/users/${encodeURIComponent(userId)}`);
}

export function updateAdminUser(userId: string, displayName: string): Promise<AdminUserDetail> {
  return apiClient.put<AdminUserDetail>(`/api/admin/users/${encodeURIComponent(userId)}`, { displayName });
}

export function lockAdminUser(userId: string): Promise<AdminUserDetail> {
  return apiClient.post<AdminUserDetail>(`/api/admin/users/${encodeURIComponent(userId)}/lock`);
}

export function unlockAdminUser(userId: string): Promise<AdminUserDetail> {
  return apiClient.post<AdminUserDetail>(`/api/admin/users/${encodeURIComponent(userId)}/unlock`);
}

export function resetAdminRatings(userId: string, gameId?: string): Promise<AdminUserDetail> {
  return apiClient.post<AdminUserDetail>(`/api/admin/users/${encodeURIComponent(userId)}/ratings/reset`, {
    gameId: gameId ?? null,
  });
}

export function getAdminMatches(params: {
  game?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<AdminMatchRow>> {
  const query = new URLSearchParams();
  if (params.game) query.set('game', params.game);
  if (params.status) query.set('status', params.status);
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 20));
  return apiClient.get<PagedResult<AdminMatchRow>>(`/api/admin/matches?${query}`);
}

export function getAdminRooms(params: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<AdminRoomRow>> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 20));
  return apiClient.get<PagedResult<AdminRoomRow>>(`/api/admin/rooms?${query}`);
}

export function closeAdminRoom(roomId: string): Promise<void> {
  return apiClient.post<void>(`/api/admin/rooms/${encodeURIComponent(roomId)}/close`);
}
