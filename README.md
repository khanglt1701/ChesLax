# Cheslax

**Play. Relax. Repeat.**

Cheslax là website chơi board game và trò chơi dân gian ngay trên trình duyệt. Phiên bản đầu gồm **Cờ vua** và **Ô ăn quan**, chơi hai người trên cùng một thiết bị. Chưa cần backend hay đăng nhập.

## Chạy dự án

```bash
npm install
npm run dev
```

Các lệnh khác:

```bash
npm test          # unit test logic game
npm run build     # build production
npm run preview   # xem bản build
```

Mở địa chỉ Vite in ra (thường là `http://localhost:5173`).

## Trò chơi hiện có

| Trò chơi   | Đường dẫn            | Trạng thái     |
| ---------- | -------------------- | -------------- |
| Cờ vua     | `/games/chess`       | Chơi được      |
| Ô ăn quan  | `/games/o-an-quan`   | Chơi được      |
| Caro       | —                    | Đang phát triển |
| Sudoku     | —                    | Đang phát triển |

## Luật ô ăn quan (phiên bản Cheslax)

Ô ăn quan có nhiều biến thể theo vùng miền. Cheslax dùng một bộ luật phổ thông, tách riêng trong `src/games/o-an-quan/oAnQuanEngine.ts` và được kiểm thử độc lập với giao diện.

- Bàn 12 ô: 10 ô dân (2 hàng × 5) và 2 ô quan ở hai đầu.
- Khởi tạo: mỗi ô dân 5 quân dân, mỗi ô quan 1 quân quan.
- Điểm: dân = 1, quan = 5.
- Người chơi 1 sở hữu hàng dưới, người chơi 2 sở hữu hàng trên.
- Mỗi lượt chọn một ô dân của mình đang còn quân, rồi rải **trái** hoặc **phải** theo vòng bàn.
- Rải từng quân một vào các ô tiếp theo (kể cả ô quan).
- Nếu ô kế tiếp là **ô dân còn quân**, lấy quân ô đó rải tiếp cùng hướng.
- Nếu ô kế tiếp là **ô quan còn quân**, không lấy để rải — hết lượt.
- Nếu ô kế tiếp **trống** và ô ngay sau còn quân thì **ăn** quân ô đó (dân và/hoặc quan). Ăn liên hoàn khi các ô xen kẽ trống / có quân.
- Nếu đến lượt mà hàng dân trống: **tiếp quân** 5 dân từ số đã ăn (thiếu thì đổi 1 quan = 5 dân). Không đủ quân để tiếp thì thua.
- Khi **cả hai ô quan hết quân**, ván kết thúc. Mỗi bên cộng quân dân còn trên hàng của mình rồi so điểm.

## Kiến trúc

Logic game nằm trong module thuần TypeScript, tách khỏi React:

- `src/games/chess/chessService.ts` — bọc `chess.js`
- `src/games/o-an-quan/oAnQuanEngine.ts` — luật ô ăn quan

Cờ vua có cài đặt đồng hồ (tổng thời gian mỗi bên và giới hạn mỗi nước), tạm dừng, và chế độ toàn màn hình. Cài đặt được lưu trên thiết bị.

Giao diện, theme và thống kê:

- Theme sáng/tối, cài đặt cờ vua và thống kê ván chơi lưu bằng LocalStorage.
- Thêm game mới: khai báo trong `src/games/catalog.ts`, tạo thư mục `src/games/<id>/`, thêm route.

Hướng mở rộng sau này: đăng nhập, phòng chơi online, matchmaking, AI và bảng xếp hạng. Các chế độ đó **chưa được triển khai** nên không có nút giả.

## Công nghệ

React 19, TypeScript, Vite, Tailwind CSS 4, React Router, chess.js, Zustand, Vitest.
