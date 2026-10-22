# Cheslax

**Play. Relax. Repeat.**

Cheslax là website chơi board game và trò chơi dân gian ngay trên trình duyệt. Có **Cờ vua** (máy 3 mức, hai người trên một máy, hoặc online) và **Ô ăn quan** (hai người tại chỗ hoặc online).

## Chạy dự án

```bash
npm install
npm run dev
```

Lệnh này mở **cả frontend Vite và backend Socket.IO**. Mở địa chỉ Vite in ra (thường là `http://localhost:5173`).

Chạy tách:

```bash
npm run dev:client    # Vite, cổng 5173
npm run dev:server    # API + Socket.IO, cổng 3001
```

Các lệnh khác:

```bash
npm test          # unit + integration (engine, phòng, rating)
npm run build     # build production frontend
npm run preview   # xem bản build (cần backend nếu muốn chơi online)
npm run start:server
```

Backend ghi Elo online vào `server/data/ratings.json` (tạo tự động, không commit). Không dùng Redis ở phiên bản này.

Biến môi trường tùy chọn:

- `PORT` — cổng server (mặc định `3001`)
- `CORS_ORIGIN` — danh sách origin, phân tách bằng dấu phẩy. Nếu bỏ trống, server chấp nhận mọi origin để thử hai thiết bị trong mạng LAN.
- `VITE_SERVER_URL` — URL backend khi frontend không đi qua proxy Vite (ví dụ bản `preview`)

## Chơi online trên hai thiết bị

Đây là multiplayer thật (Socket.IO), không phải mô phỏng bằng LocalStorage.

1. Chạy `npm run dev` trên máy chủ phòng.
2. Người A mở site → **Chơi online** / **Chơi với bạn bè** → chọn game → **Tạo phòng**.
3. Sao chép mã phòng hoặc đường dẫn `/play/XXXXXX` gửi cho người B.
4. Người B mở link hoặc nhập mã. **Hai tab cùng trình duyệt / cùng máy sẽ dùng chung một danh tính** nên không chiếm được cả hai ghế. Dùng cửa sổ ẩn danh, trình duyệt khác, hoặc điện thoại để thành người thứ hai.
5. Ván chỉ bắt đầu khi đủ hai người. Nước đi được máy chủ kiểm tra theo luật (`chess.js` / engine ô ăn quan). Elo chỉ cập nhật khi server xác nhận ván kết thúc.

Điện thoại trong cùng Wi-Fi: mở `http://<IP-máy-chủ>:5173` (Vite `host: true`). Nếu mất kết nối, vào lại bằng cùng mã phòng — không tạo ván mới.

Nếu backend chưa chạy, giao diện báo không kết nối được máy chủ. Đừng coi online đã hoạt động khi chỉ mở frontend.

## Trò chơi hiện có

| Trò chơi   | Đường dẫn            | Trạng thái      |
| ---------- | -------------------- | --------------- |
| Cờ vua     | `/games/chess`       | Chơi được       |
| Ô ăn quan  | `/games/o-an-quan`   | Chơi được       |
| Online     | `/online`, `/play/:code` | Cờ vua và ô ăn quan |
| Caro       | —                    | Đang phát triển |
| Sudoku     | —                    | Đang phát triển |

## Giao diện bàn cờ

Cờ vua có 3 mặt bàn (Gỗ cổ điển, Đá cẩm thạch, Hiện đại). Bộ quân mặc định là **Fantasy** của Maurizio Monge (SVG gốc, MIT, lưu local tại `public/pieces/fantasy/`). Classic và Modern vẫn chọn được trong Cài đặt. Đổi giao diện không bắt đầu ván mới. Ô ăn quan dùng bàn gỗ / sỏi vector, animation rải quân không đụng luật.

Xem `THIRD_PARTY_NOTICES.md` cho bản quyền bộ quân Fantasy.

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
- `src/games/chess/chessAi.ts` — máy chơi cờ (Dễ / Vừa / Khó)
- `src/games/o-an-quan/oAnQuanEngine.ts` — luật ô ăn quan (dùng chung client và server)
- `src/ranking/` — 15 cấp bậc, Elo, lịch sử điểm
- `src/online/` — protocol và dịch vụ Socket.IO phía client
- `server/src/` — phòng, xác thực nước đi, reconnect, Elo online

Cờ vua local có chế độ đấu với máy, đồng hồ, tạm dừng, toàn màn hình, và Elo khi đấu máy. Online: đồng hồ 5 phút / 10 phút / không giới hạn do **server** giữ; client không được ghi đè FEN hay điểm.

Xếp hạng: 15 cấp từ Tập Sự đến Kỳ Thánh, Elo riêng cho cờ vua và ô ăn quan. Ván máy (cờ vua) tính trên thiết bị. Ván online tính trên server rồi đồng bộ vào hồ sơ local (idempotent theo `matchId`). Bảng `/leaderboard` vẫn có dữ liệu demo cho người chơi khác.

## Kiểm thử multiplayer

`npm test` phủ:

- Mã phòng duy nhất, phòng đầy, cùng identity không chiếm hai ghế
- Sai lượt, nước trái luật, version cũ, người ngoài phòng
- Ô ăn quan: ô/hướng do server kiểm
- Rating chỉ cộng một lần sau khi ván kết thúc
- Hai game không đụng trạng thái nhau
- Reconnect giữ nguyên ván

Thử tay: hai client độc lập (ẩn danh + thường, hoặc máy + điện thoại), tạo phòng, đi vài nước, tải lại trang, tắt mạng tạm thời.

## Công nghệ

React 19, TypeScript, Vite, Tailwind CSS 4, React Router, chess.js, Zustand, Vitest, Express, Socket.IO.
