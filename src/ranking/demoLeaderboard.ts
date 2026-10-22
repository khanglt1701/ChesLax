import { LOCAL_PLAYER_ID } from './ratingEngine';
import type { PlayerGameRating, PlayerProfileData, RatedGameId } from './ratingTypes';

export interface LeaderboardRow {
  id: string;
  rankIndex: number;
  name: string;
  avatarId: string;
  rating: number;
  gamesPlayed: number;
  isDemo: boolean;
  isCurrentPlayer: boolean;
}

interface DemoPlayer {
  id: string;
  name: string;
  avatarId: string;
  chess: number;
  oAnQuan: number;
  games: number;
}

const DEMO_PLAYERS: DemoPlayer[] = [
  { id: 'demo-an', name: 'An Kỳ', avatarId: 'seal-2', chess: 2_140, oAnQuan: 1_680, games: 86 },
  { id: 'demo-binh', name: 'Bình Lão', avatarId: 'seal-3', chess: 1_920, oAnQuan: 2_050, games: 64 },
  { id: 'demo-chi', name: 'Chiêu Vân', avatarId: 'seal-4', chess: 1_560, oAnQuan: 1_310, games: 41 },
  { id: 'demo-dung', name: 'Dũng Sĩ', avatarId: 'seal-5', chess: 1_280, oAnQuan: 1_740, games: 33 },
  { id: 'demo-ha', name: 'Hà Giang', avatarId: 'seal-6', chess: 2_430, oAnQuan: 1_120, games: 102 },
  { id: 'demo-lam', name: 'Lâm Phong', avatarId: 'seal-7', chess: 1_050, oAnQuan: 980, games: 18 },
  { id: 'demo-my', name: 'Mỹ Ngọc', avatarId: 'seal-8', chess: 1_780, oAnQuan: 1_455, games: 57 },
  { id: 'demo-phuc', name: 'Phúc Tâm', avatarId: 'seal-2', chess: 880, oAnQuan: 1_210, games: 22 },
  { id: 'demo-quang', name: 'Quang Minh', avatarId: 'seal-3', chess: 2_670, oAnQuan: 1_890, games: 91 },
  { id: 'demo-tram', name: 'Trâm Anh', avatarId: 'seal-4', chess: 1_330, oAnQuan: 2_280, games: 48 },
  { id: 'demo-uyen', name: 'Uyên Nhi', avatarId: 'seal-5', chess: 2_010, oAnQuan: 1_640, games: 70 },
  { id: 'demo-vu', name: 'Vũ Sơn', avatarId: 'seal-6', chess: 1_470, oAnQuan: 760, games: 29 },
];

export const LEADERBOARD_PAGE_SIZE = 8;

export function buildLeaderboard(
  gameId: RatedGameId,
  player: PlayerProfileData,
  rating: PlayerGameRating,
): LeaderboardRow[] {
  const rows: Omit<LeaderboardRow, 'rankIndex'>[] = DEMO_PLAYERS.map((demo) => ({
    id: demo.id,
    name: demo.name,
    avatarId: demo.avatarId,
    rating: gameId === 'chess' ? demo.chess : demo.oAnQuan,
    gamesPlayed: demo.games,
    isDemo: true,
    isCurrentPlayer: false,
  }));

  rows.push({
    id: player.id || LOCAL_PLAYER_ID,
    name: player.name,
    avatarId: player.avatarId,
    rating: rating.rating,
    gamesPlayed: rating.gamesPlayed,
    isDemo: false,
    isCurrentPlayer: true,
  });

  return rows
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name, 'vi'))
    .map((row, index) => ({ ...row, rankIndex: index + 1 }));
}
