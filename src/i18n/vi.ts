export const vi = {
  brand: {
    name: 'Cheslax',
    tagline: 'Play. Relax. Repeat.',
  },
  nav: {
    home: 'Trang chủ',
    games: 'Trò chơi',
    guide: 'Hướng dẫn',
    stats: 'Thống kê',
    settings: 'Cài đặt',
  },
  home: {
    heroTitle: 'Một ván chơi, một chút thư giãn',
    heroBody:
      'Chơi trên một máy hoặc đấu với máy mà không cần mạng. Muốn chơi hai thiết bị, tạo phòng bằng mã. Phòng online dùng Firebase và không cần tài khoản.',
    playChess: 'Chơi cờ vua',
    playOAnQuan: 'Chơi ô ăn quan',
    playCaro: 'Chơi caro',
    playCoTuong: 'Chơi cờ tướng',
    playCoGanh: 'Chơi cờ gánh',
    playImposter: 'Chơi kẻ giả mạo',
    gamesHeading: 'Trò chơi',
    gamesSub: 'Chọn một ván và chơi ngay trên thiết bị này.',
  },
  games: {
    search: 'Tìm cờ vua, cờ tướng, cờ gánh, caro, ô ăn quan...',
    comingSoon: 'Đang phát triển',
    notOpen: 'Chưa mở',
    playNow: 'Chơi ngay',
    playRemote: 'Hai máy',
  },
  settings: {
    title: 'Cài đặt',
    subtitle: 'Tên người chơi, giao diện và bàn cờ được lưu trên thiết bị này.',
    players: 'Người chơi',
    playersHint: 'Biệt danh chỉ hiện trên máy này. Để trống sẽ dùng tên mặc định.',
    player1: 'Người chơi 1',
    player2: 'Người chơi 2',
    appearance: 'Giao diện',
    light: 'Sáng',
    dark: 'Tối',
    chessBoard: 'Bàn cờ vua',
    chessPieces: 'Bộ quân cờ',
    oAnQuanBoard: 'Bàn ô ăn quan',
    language: 'Ngôn ngữ',
    languageVi: 'Tiếng Việt',
    languageEnSoon: 'English sẽ được thêm sau, không cần sửa từng trang.',
  },
  notFound: {
    title: 'Không tìm thấy trang',
    body: 'Đường dẫn này không tồn tại hoặc trò chơi chưa được mở.',
    home: 'Về trang chủ',
    games: 'Xem trò chơi',
  },
} as const;

export type MessageTree = typeof vi;
