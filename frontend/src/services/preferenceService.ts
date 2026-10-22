import type { ChessAppearance } from '@/games/chess/chessAppearance';
import type { OAnQuanThemeId } from '@/games/o-an-quan/oAnQuanAppearance';
import type { Theme } from '@/store/themeStore';
import { apiClient } from './apiClient';

export interface UserPreferenceDto {
  theme: Theme;
  chessBoardTheme: ChessAppearance['boardTheme'];
  chessPieceSet: ChessAppearance['pieceSet'];
  oAnQuanTheme: OAnQuanThemeId;
  updatedAt: string;
}

export interface UpdatePreferencePayload {
  theme: Theme;
  chessBoardTheme: ChessAppearance['boardTheme'];
  chessPieceSet: ChessAppearance['pieceSet'];
  oAnQuanTheme: OAnQuanThemeId;
}

export function getMyPreferences(): Promise<UserPreferenceDto> {
  return apiClient.get<UserPreferenceDto>('/api/users/me/preferences');
}

export function updateMyPreferences(payload: UpdatePreferencePayload): Promise<UserPreferenceDto> {
  return apiClient.put<UserPreferenceDto>('/api/users/me/preferences', payload);
}
