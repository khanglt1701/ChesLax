export interface WordPair {
  category: string;
  civilian: string;
  undercover: string;
  difficulty: 1 | 2 | 3;
}

export const CATEGORIES: { id: string; label: string }[] = [
  { id: 'animals', label: 'Động vật' },
  { id: 'food', label: 'Đồ ăn thức uống' },
  { id: 'objects', label: 'Đồ vật' },
  { id: 'jobs', label: 'Nghề nghiệp' },
  { id: 'places', label: 'Địa điểm' },
  { id: 'sports', label: 'Thể thao' },
  { id: 'entertainment', label: 'Giải trí' },
  { id: 'culture', label: 'Văn hóa Việt Nam' },
  { id: 'technology', label: 'Công nghệ' },
];

export const WORD_PAIRS: WordPair[] = [
  { category: 'animals', civilian: 'Mèo', undercover: 'Chó', difficulty: 1 },
  { category: 'animals', civilian: 'Hổ', undercover: 'Báo', difficulty: 2 },
  { category: 'animals', civilian: 'Cá mập', undercover: 'Cá voi', difficulty: 2 },
  { category: 'animals', civilian: 'Ong', undercover: 'Bướm', difficulty: 1 },
  { category: 'animals', civilian: 'Gà', undercover: 'Vịt', difficulty: 1 },
  { category: 'animals', civilian: 'Ngựa', undercover: 'Lừa', difficulty: 2 },
  { category: 'food', civilian: 'Cà phê', undercover: 'Trà', difficulty: 1 },
  { category: 'food', civilian: 'Phở', undercover: 'Bún', difficulty: 1 },
  { category: 'food', civilian: 'Bánh mì', undercover: 'Bánh bao', difficulty: 1 },
  { category: 'food', civilian: 'Pizza', undercover: 'Hamburger', difficulty: 2 },
  { category: 'food', civilian: 'Xoài', undercover: 'Đu đủ', difficulty: 1 },
  { category: 'food', civilian: 'Cơm', undercover: 'Cháo', difficulty: 1 },
  { category: 'objects', civilian: 'Điện thoại', undercover: 'Máy tính bảng', difficulty: 1 },
  { category: 'objects', civilian: 'Ô', undercover: 'Áo mưa', difficulty: 1 },
  { category: 'objects', civilian: 'Bút', undercover: 'Bút chì', difficulty: 1 },
  { category: 'objects', civilian: 'Kéo', undercover: 'Dao', difficulty: 2 },
  { category: 'objects', civilian: 'Túi', undercover: 'Balo', difficulty: 1 },
  { category: 'jobs', civilian: 'Bác sĩ', undercover: 'Y tá', difficulty: 1 },
  { category: 'jobs', civilian: 'Giáo viên', undercover: 'Giảng viên', difficulty: 2 },
  { category: 'jobs', civilian: 'Đầu bếp', undercover: 'Phụ bếp', difficulty: 1 },
  { category: 'jobs', civilian: 'Phi công', undercover: 'Tiếp viên', difficulty: 2 },
  { category: 'jobs', civilian: 'Ca sĩ', undercover: 'Diễn viên', difficulty: 1 },
  { category: 'places', civilian: 'Biển', undercover: 'Hồ bơi', difficulty: 1 },
  { category: 'places', civilian: 'Sân bay', undercover: 'Nhà ga', difficulty: 2 },
  { category: 'places', civilian: 'Trường học', undercover: 'Thư viện', difficulty: 1 },
  { category: 'places', civilian: 'Bệnh viện', undercover: 'Phòng khám', difficulty: 2 },
  { category: 'places', civilian: 'Công viên', undercover: 'Vườn thú', difficulty: 1 },
  { category: 'sports', civilian: 'Bóng đá', undercover: 'Bóng rổ', difficulty: 1 },
  { category: 'sports', civilian: 'Cầu lông', undercover: 'Quần vợt', difficulty: 1 },
  { category: 'sports', civilian: 'Bơi lội', undercover: 'Lặn', difficulty: 2 },
  { category: 'sports', civilian: 'Cờ vua', undercover: 'Cờ tướng', difficulty: 2 },
  { category: 'sports', civilian: 'Chạy bộ', undercover: 'Đi bộ', difficulty: 1 },
  { category: 'entertainment', civilian: 'Phim', undercover: 'Kịch', difficulty: 1 },
  { category: 'entertainment', civilian: 'Karaoke', undercover: 'Hòa nhạc', difficulty: 2 },
  { category: 'entertainment', civilian: 'Truyện tranh', undercover: 'Tiểu thuyết', difficulty: 2 },
  { category: 'entertainment', civilian: 'Nhạc pop', undercover: 'Nhạc rock', difficulty: 1 },
  { category: 'culture', civilian: 'Áo dài', undercover: 'Áo bà ba', difficulty: 1 },
  { category: 'culture', civilian: 'Tết', undercover: 'Trung thu', difficulty: 2 },
  { category: 'culture', civilian: 'Nón lá', undercover: 'Khăn rằn', difficulty: 2 },
  { category: 'culture', civilian: 'Múa lân', undercover: 'Múa rối nước', difficulty: 3 },
  { category: 'culture', civilian: 'Bạc xỉu', undercover: 'Cà phê sữa', difficulty: 1 },
  { category: 'technology', civilian: 'Laptop', undercover: 'Máy tính bảng', difficulty: 1 },
  { category: 'technology', civilian: 'Wi-Fi', undercover: 'Dữ liệu di động', difficulty: 2 },
  { category: 'technology', civilian: 'Tai nghe', undercover: 'Loa', difficulty: 1 },
  { category: 'technology', civilian: 'Email', undercover: 'Tin nhắn', difficulty: 1 },
  { category: 'technology', civilian: 'Máy ảnh', undercover: 'Webcam', difficulty: 2 },
];

export function categoryLabel(id: string): string {
  return CATEGORIES.find((item) => item.id === id)?.label ?? 'Mọi chủ đề';
}
