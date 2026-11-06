export const GAME_CATEGORIES = {
  board: 'Board Game',
  folk: 'Game dân gian',
  strategy: 'Game chiến thuật',
  party: 'Party game',
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
      'Luật cờ vua quốc tế, gồm nhập thành, bắt tốt qua đường, phong cấp và hòa cờ. Có thể đấu với máy ở 3 mức Dễ, Vừa, Khó hoặc hai người trên cùng thiết bị.',
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
      'Rải quân dân, ăn quân đối phương và chiếm ô quan. Chơi hai người trên cùng thiết bị. Luật phổ thông: rải tiếp khi ô kế có quân dân, ăn cách ô trống, tiếp quân khi hết quân trên hàng.',
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
      'Đặt X và O trên bàn 12×12. Thắng khi có ít nhất năm quân liên tiếp mà không bị chặn cả hai đầu. Có thể đấu với máy hoặc hai người trên cùng thiết bị.',
    players: '1 hoặc 2 người',
    categories: ['board', 'strategy'],
    status: GAME_STATUS.available,
    path: '/games/caro',
  },
  {
    id: 'co-tuong',
    name: 'Cờ tướng',
    tagline: 'Cờ Trung Quốc trên bàn 9×10',
    description:
      'Luật cờ tướng phổ thông tại Việt Nam: tướng trong cung, sĩ, tượng không qua sông, xe, pháo, mã bị cản chân, tốt sang sông. Có thể đấu với máy hoặc hai người trên cùng thiết bị.',
    players: '1 hoặc 2 người',
    categories: ['board', 'strategy'],
    status: GAME_STATUS.available,
    path: '/games/co-tuong',
  },
  {
    id: 'co-ganh',
    name: 'Cờ Gánh',
    tagline: 'Gánh và vây trên bàn 5×5',
    description:
      'Trò dân gian Việt Nam trên 25 giao điểm. Đi theo đường nối, gánh quân đối phương khi đứng giữa hai quân, vây khi đối phương hết đường đi. Có thể đấu với máy hoặc hai người trên cùng thiết bị.',
    players: '1 hoặc 2 người',
    categories: ['folk', 'board'],
    status: GAME_STATUS.available,
    path: '/games/co-ganh',
  },
  {
    id: 'imposter',
    name: 'Kẻ giả mạo',
    tagline: 'Một điện thoại, cả bàn chơi',
    description:
      'Chuyền điện thoại để mỗi người xem từ của mình. Dân thường có cùng một từ, kẻ giả mạo thì không. Có thêm kẻ nội gián và Ngài Trắng. Không cần mạng hay tài khoản.',
    players: '3–12 người',
    categories: ['party'],
    status: GAME_STATUS.available,
    path: '/games/imposter',
  },
];

export function getAvailableGames(games: GameInfo[] = GAMES): GameInfo[] {
  return games.filter((game) => game.status === GAME_STATUS.available);
}

export function getGameById(id: string, games: GameInfo[] = GAMES): GameInfo | undefined {
  return games.find((game) => game.id === id);
}
