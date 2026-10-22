export const GAME_CATEGORIES = {
  board: 'Board Game',
  folk: 'Game dân gian',
  strategy: 'Game chiến thuật',
} as const;

export type GameCategoryId = keyof typeof GAME_CATEGORIES;

export const GAME_STATUS = {
  available: 'available',
  comingSoon: 'coming_soon',
} as const;

export type GameStatus = (typeof GAME_STATUS)[keyof typeof GAME_STATUS];

export interface GameInfo {
  id: string;
  name: string;
  tagline: string;
  description: string;
  players: string;
  categories: GameCategoryId[];
  status: GameStatus;
  path: string | null;
}

export const GAMES: GameInfo[] = [
  {
    id: 'chess',
    name: 'Cờ vua',
    tagline: 'Chiến thuật cổ điển trên bàn 8×8',
    description:
      'Luật cờ vua quốc tế, gồm nhập thành, bắt tốt qua đường, phong cấp và hòa cờ. Có thể đấu với máy ở 3 mức Dễ, Vừa, Khó, hai người trên cùng thiết bị, hoặc tạo phòng online.',
    players: '1 hoặc 2 người',
    categories: ['board', 'strategy'],
    status: GAME_STATUS.available,
    path: '/games/chess',
  },
  {
    id: 'o-an-quan',
    name: 'Ô ăn quan',
    tagline: 'Trò chơi dân gian trên bàn 12 ô',
    description:
      'Rải quân dân, ăn quân đối phương và chiếm ô quan. Có thể chơi hai người trên cùng thiết bị hoặc online. Luật phổ thông: rải tiếp khi ô kế có quân dân, ăn cách ô trống, tiếp quân khi hết quân trên hàng.',
    players: '2 người',
    categories: ['folk', 'board'],
    status: GAME_STATUS.available,
    path: '/games/o-an-quan',
  },
  {
    id: 'caro',
    name: 'Caro',
    tagline: 'Năm quân liên tiếp để thắng',
    description:
      'Đặt X và O trên bàn cờ. Trò chơi này đang được phát triển và sẽ sớm có mặt trên Cheslax.',
    players: '2 người',
    categories: ['board', 'strategy'],
    status: GAME_STATUS.comingSoon,
    path: null,
  },
  {
    id: 'sudoku',
    name: 'Sudoku',
    tagline: 'Điền số, rèn tư duy logic',
    description:
      'Điền các ô trống sao cho mỗi hàng, cột và khối 3×3 đều đủ số từ 1 đến 9. Sẽ được bổ sung ở phiên bản sau.',
    players: '1 người',
    categories: ['strategy'],
    status: GAME_STATUS.comingSoon,
    path: null,
  },
];

export function getAvailableGames(): GameInfo[] {
  return GAMES.filter((game) => game.status === GAME_STATUS.available);
}

export function getGameById(id: string): GameInfo | undefined {
  return GAMES.find((game) => game.id === id);
}
