import type {
  Ack,
  ChessMovePayload,
  ColorPref,
  OAnQuanMovePayload,
  OnlineGameId,
  PublicSeat,
  RoomPublicState,
  RoomResultPublic,
  RoomStatus,
  TimeControlId,
} from '@/online/protocol';
import { apiClient, ApiError } from './apiClient';

export interface RoomDto {
  code: string;
  game: OnlineGameId;
  mode: 'casual' | 'ranked';
  rated: boolean;
  status: RoomStatus;
  version: number;
  timeControl: TimeControlId;
  you: { playerId: string; side: PublicSeat['side'] } | null;
  seats: PublicSeat[];
  waiting: boolean;
  chess: RoomPublicState['chess'];
  oAnQuan: RoomPublicState['oAnQuan'];
  result: RoomResultPublic | null;
  disconnectDeadline: string | null;
  createdAt: string;
  matchId: string | null;
  opponentType?: 'ai' | 'human';
  aiDifficulty?: string | null;
  aiDifficultyLabel?: string | null;
  aiRatingPolicy?: string | null;
  opponentRating?: number | null;
}

export interface QueueStatusDto {
  status: 'searching' | 'matched';
  gameId: OnlineGameId;
  rating: number;
  waitedSeconds: number;
  allowedSpread: number;
  enqueuedAt: string;
  matchmakingMode?: string;
  opponentType?: 'ai' | 'human' | null;
  match?: {
    matchId: string;
    roomCode: string;
    gameId: OnlineGameId;
    mode: string;
    opponentType?: string;
    aiDifficulty?: string | null;
    aiDifficultyLabel?: string | null;
  } | null;
}

export async function ensureGuestSession(profile: { name: string; avatarId: string }): Promise<void> {
  await apiClient.post('/api/auth/guest', { displayName: profile.name, avatarId: profile.avatarId });
}

export function createCasualRoom(payload: {
  gameId: OnlineGameId;
  timeControl?: TimeControlId;
  colorPref?: ColorPref;
}): Promise<RoomDto> {
  return apiClient.post<RoomDto>('/api/rooms', {
    gameId: payload.gameId,
    timeControl: payload.timeControl ?? 'off',
    colorPref: payload.colorPref ?? 'random',
  });
}

export function joinRoom(code: string): Promise<RoomDto> {
  return apiClient.post<RoomDto>(`/api/rooms/${encodeURIComponent(code)}/join`, {});
}

export function getRoom(code: string): Promise<RoomDto> {
  return apiClient.get<RoomDto>(`/api/rooms/${encodeURIComponent(code)}`);
}

export function leaveRoom(code: string): Promise<void> {
  return apiClient.post<void>(`/api/rooms/${encodeURIComponent(code)}/leave`);
}

export function chessMove(code: string, payload: Omit<ChessMovePayload, 'code'>): Promise<RoomDto> {
  return apiClient.post<RoomDto>(`/api/rooms/${encodeURIComponent(code)}/chess/moves`, payload);
}

export function oAnQuanMove(code: string, payload: Omit<OAnQuanMovePayload, 'code'>): Promise<RoomDto> {
  return apiClient.post<RoomDto>(`/api/rooms/${encodeURIComponent(code)}/o-an-quan/moves`, payload);
}

export function resignRoom(code: string): Promise<RoomDto> {
  return apiClient.post<RoomDto>(`/api/rooms/${encodeURIComponent(code)}/resign`);
}

export function enqueueRanked(gameId: OnlineGameId): Promise<QueueStatusDto> {
  return apiClient.post<QueueStatusDto>('/api/matchmaking/ranked', { gameId });
}

export function cancelRanked(): Promise<void> {
  return apiClient.delete<void>('/api/matchmaking/ranked');
}

export async function getRankedStatus(): Promise<QueueStatusDto | null> {
  try {
    return await apiClient.get<QueueStatusDto>('/api/matchmaking/ranked');
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export function mapRoomDto(dto: RoomDto): RoomPublicState {
  return {
    code: dto.code,
    game: dto.game,
    mode: dto.mode,
    rated: dto.rated,
    status: dto.status,
    version: dto.version,
    timeControl: dto.timeControl,
    you: dto.you,
    seats: dto.seats,
    waiting: dto.waiting,
    chess: dto.chess,
    oAnQuan: dto.oAnQuan,
    result: dto.result
      ? {
          reason: dto.result.reason,
          winnerSide: dto.result.winnerSide,
          rated: dto.result.rated,
          yourChange: dto.result.yourChange,
          opponentType: dto.result.opponentType,
          aiDifficulty: dto.result.aiDifficulty,
          aiDifficultyLabel: dto.result.aiDifficultyLabel,
        }
      : null,
    disconnectDeadline: dto.disconnectDeadline ? Date.parse(dto.disconnectDeadline) : null,
    createdAt: Date.parse(dto.createdAt),
    matchId: dto.matchId,
    opponentType: dto.opponentType,
    aiDifficulty: dto.aiDifficulty,
    aiDifficultyLabel: dto.aiDifficultyLabel,
    aiRatingPolicy: dto.aiRatingPolicy,
    opponentRating: dto.opponentRating,
  };
}

export function toAck(error: unknown, fallback: string): Ack {
  return {
    ok: false,
    error: error instanceof ApiError ? error.message : error instanceof Error ? error.message : fallback,
  };
}

export function isOnlineGameId(value: string | undefined): value is OnlineGameId {
  return value === 'chess' || value === 'o-an-quan';
}
