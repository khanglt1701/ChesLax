export type RankId =
  | 'tap-su'
  | 'nhap-mon'
  | 'hoc-ky'
  | 'ky-do'
  | 'ky-si'
  | 'ky-khach'
  | 'ky-su'
  | 'cao-thu'
  | 'dai-su'
  | 'tong-su'
  | 'danh-ky'
  | 'ky-vuong'
  | 'ky-hoang'
  | 'ky-de'
  | 'ky-thanh';

export type RankEmblem = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king' | 'crown' | 'legend';

export interface RankDefinition {
  id: RankId;
  level: number;
  name: string;
  minRating: number;
  maxRating: number | null;
  description: string;
  color: string;
  accent: string;
  emblem: RankEmblem;
  order: number;
}

export const STARTING_RATING = 1_000;
export const ELO_K_FACTOR = 32;
export const RATING_HISTORY_LIMIT = 50;
export const CURRENT_SEASON_ID = 'cheslax-local';

export const RANKS: RankDefinition[] = [
  {
    id: 'tap-su',
    level: 1,
    name: 'Tập Sự',
    minRating: 0,
    maxRating: 599,
    description: 'Bước đầu vào bàn cờ, học cách đi từng quân.',
    color: '#78716c',
    accent: '#d6d3d1',
    emblem: 'pawn',
    order: 1,
  },
  {
    id: 'nhap-mon',
    level: 2,
    name: 'Nhập Môn',
    minRating: 600,
    maxRating: 799,
    description: 'Đã quen luật cơ bản, bắt đầu nhìn ra vài mối đe dọa.',
    color: '#b45309',
    accent: '#fdba74',
    emblem: 'pawn',
    order: 2,
  },
  {
    id: 'hoc-ky',
    level: 3,
    name: 'Học Kỳ',
    minRating: 800,
    maxRating: 999,
    description: 'Biết khai cuộc đơn giản và giữ quân không còn tùy hứng.',
    color: '#c2410c',
    accent: '#fdba74',
    emblem: 'knight',
    order: 3,
  },
  {
    id: 'ky-do',
    level: 4,
    name: 'Kỳ Đồ',
    minRating: 1_000,
    maxRating: 1_199,
    description: 'Điểm khởi đầu Cheslax. Có thể chơi một ván trọn vẹn.',
    color: '#d97706',
    accent: '#fcd34d',
    emblem: 'knight',
    order: 4,
  },
  {
    id: 'ky-si',
    level: 5,
    name: 'Kỳ Sĩ',
    minRating: 1_200,
    maxRating: 1_399,
    description: 'Nắm vài đòn chiến thuật và biết đổi quân có chủ đích.',
    color: '#0f766e',
    accent: '#5eead4',
    emblem: 'bishop',
    order: 5,
  },
  {
    id: 'ky-khach',
    level: 6,
    name: 'Kỳ Khách',
    minRating: 1_400,
    maxRating: 1_599,
    description: 'Chơi chắc, ít bỏ quân và biết giữ thế cờ.',
    color: '#0e7490',
    accent: '#67e8f9',
    emblem: 'bishop',
    order: 6,
  },
  {
    id: 'ky-su',
    level: 7,
    name: 'Kỳ Sư',
    minRating: 1_600,
    maxRating: 1_799,
    description: 'Tính trước vài nước, khai cuộc có hình và tàn cuộc rõ ràng.',
    color: '#1d4ed8',
    accent: '#93c5fd',
    emblem: 'rook',
    order: 7,
  },
  {
    id: 'cao-thu',
    level: 8,
    name: 'Cao Thủ',
    minRating: 1_800,
    maxRating: 1_999,
    description: 'Ép nhịp, phạt lỗi đối thủ và giữ lợi thế đến hết ván.',
    color: '#4338ca',
    accent: '#c7d2fe',
    emblem: 'rook',
    order: 8,
  },
  {
    id: 'dai-su',
    level: 9,
    name: 'Đại Sư',
    minRating: 2_000,
    maxRating: 2_199,
    description: 'Thế trận sâu, ít sai sót và biết chuyển thắng từ ưu nhỏ.',
    color: '#7c3aed',
    accent: '#ddd6fe',
    emblem: 'queen',
    order: 9,
  },
  {
    id: 'tong-su',
    level: 10,
    name: 'Tông Sư',
    minRating: 2_200,
    maxRating: 2_399,
    description: 'Kiểm soát bàn cờ, đọc ý đồ đối thủ và giữ thế chủ động.',
    color: '#a16207',
    accent: '#fde68a',
    emblem: 'queen',
    order: 10,
  },
  {
    id: 'danh-ky',
    level: 11,
    name: 'Danh Kỳ',
    minRating: 2_400,
    maxRating: 2_599,
    description: 'Tên tuổi trong làng cờ Cheslax, ít khi mất thế vô cớ.',
    color: '#b45309',
    accent: '#fcd34d',
    emblem: 'king',
    order: 11,
  },
  {
    id: 'ky-vuong',
    level: 12,
    name: 'Kỳ Vương',
    minRating: 2_600,
    maxRating: 2_799,
    description: 'Áp đảo đa số đối thủ, khai cuộc và tàn cuộc đều sắc.',
    color: '#c2410c',
    accent: '#fed7aa',
    emblem: 'king',
    order: 12,
  },
  {
    id: 'ky-hoang',
    level: 13,
    name: 'Kỳ Hoàng',
    minRating: 2_800,
    maxRating: 2_999,
    description: 'Uy lực trên bàn cờ, hiếm khi để đối thủ có cơ hội gỡ.',
    color: '#be123c',
    accent: '#fecdd3',
    emblem: 'crown',
    order: 13,
  },
  {
    id: 'ky-de',
    level: 14,
    name: 'Kỳ Đế',
    minRating: 3_000,
    maxRating: 3_199,
    description: 'Gần đỉnh thang điểm nội bộ, mỗi nước đều có trọng lượng.',
    color: '#9f1239',
    accent: '#fda4af',
    emblem: 'crown',
    order: 14,
  },
  {
    id: 'ky-thanh',
    level: 15,
    name: 'Kỳ Thánh',
    minRating: 3_200,
    maxRating: null,
    description: 'Cấp cao nhất Cheslax. Huyền thoại trên thang điểm nội bộ.',
    color: '#b45309',
    accent: '#fef3c7',
    emblem: 'legend',
    order: 15,
  },
];

export const MAX_RANK = RANKS[RANKS.length - 1]!;
