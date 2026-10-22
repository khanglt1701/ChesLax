import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RANKS } from '@/ranking/rankConfig';
import { formatRating } from '@/ranking/rankService';
import { getMetaRanks } from '@/services/metaService';

export function GuidePage() {
  const ranksQuery = useQuery({ queryKey: ['meta', 'ranks'], queryFn: getMetaRanks });
  const ranks = ranksQuery.data ?? RANKS.map((rank) => ({
    id: rank.id,
    level: rank.level,
    name: rank.name,
    minRating: rank.minRating,
    maxRating: rank.maxRating,
  }));

  return (
    <div className="prose-none mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="font-display text-4xl">Hướng dẫn</h1>
        <p className="mt-3 leading-7 text-stone-600 dark:text-stone-300">
          Cheslax hiện có hai trò chơi hoàn chỉnh, không cần đăng nhập. Cờ vua có thể đấu với máy hoặc hai người
          trên cùng thiết bị. Ô ăn quan chơi hai người. Có thang 15 cấp bậc nội bộ từ Tập Sự đến Kỳ Thánh.
        </p>
      </div>

      <section className="rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        <h2 className="font-display text-2xl">Cờ vua</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-stone-600 dark:text-stone-300">
          <li>Bàn 8×8, Trắng đi trước. Mỗi bên 16 quân, vị trí bắt đầu chuẩn quốc tế.</li>
          <li>Chỉ được đi nước hợp lệ. Luật do thư viện chess.js xử lý, gồm nhập thành, bắt tốt qua đường và phong cấp.</li>
          <li>
            Có chế độ đấu với máy 3 mức: Dễ (hay sai, dễ bắt quân), Vừa (tính nước cơ bản) và Khó (tính sâu hơn, ít bỏ
            quân). Chọn mức khi bắt đầu ván, không đổi được giữa trận. Có thể chọn cầm Trắng hoặc Đen.
          </li>
          <li>Ván kết thúc khi chiếu hết, hết nước đi (hòa), thiếu quân, lặp thế cờ, luật 50 nước hoặc hết giờ.</li>
          <li>Có thể đặt tổng thời gian mỗi bên và giới hạn thời gian mỗi nước. Hết giờ thì đối phương thắng.</li>
          <li>Có thể lật bàn, hoàn tác, tạm dừng đồng hồ, bật toàn màn hình và bắt đầu ván mới.</li>
          <li>
            Đấu với máy tính Elo (K = 32, khởi đầu 1.000). Hai người trên cùng thiết bị không tính xếp hạng. Điểm lưu
            local, chưa xác minh máy chủ.
          </li>
        </ul>
        <Link to="/games/chess" className="mt-4 inline-flex text-sm font-medium text-brand hover:underline">
          Chơi cờ vua
        </Link>
      </section>

      <section className="rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        <h2 className="font-display text-2xl">Ô ăn quan</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
          Ô ăn quan có nhiều biến thể theo vùng miền. Cheslax dùng một bộ luật phổ thông, thống nhất và có kiểm
          thử, để hai người chơi được ván hoàn chỉnh ngay trên trình duyệt.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-stone-600 dark:text-stone-300">
          <li>Bàn 12 ô: 10 ô dân (hai hàng, mỗi hàng 5) và 2 ô quan ở hai đầu.</li>
          <li>Khởi tạo: mỗi ô dân 5 quân dân, mỗi ô quan 1 quân quan. Quan tính 5 điểm, dân tính 1 điểm.</li>
          <li>Người chơi 1 sở hữu hàng dưới, người chơi 2 sở hữu hàng trên. Chỉ chọn ô dân của mình đang còn quân.</li>
          <li>
            Rải từng quân một theo hướng trái hoặc phải (theo vòng bàn). Nếu ô kế tiếp là ô dân còn quân thì lấy
            quân đó rải tiếp cùng hướng.
          </li>
          <li>Không lấy quân từ ô quan để rải tiếp. Nếu ô kế là ô quan còn quân thì hết lượt.</li>
          <li>
            Nếu ô kế trống và ô sau đó còn quân thì ăn quân ô đó (cả dân lẫn quan). Tiếp tục ăn liên hoàn khi các
            ô xen kẽ trống / có quân.
          </li>
          <li>
            Nếu đến lượt mà hàng dân của mình trống, tiếp quân: lấy 5 điểm từ số đã ăn (ưu tiên dân, thiếu thì đổi
            1 quan = 5 dân) rồi đặt 1 quân vào mỗi ô. Không đủ quân để tiếp thì thua.
          </li>
          <li>
            Khi cả hai ô quan hết quân, ván kết thúc. Mỗi bên cộng quân dân còn trên hàng của mình, so tổng điểm
            để quyết định thắng, thua hoặc hòa.
          </li>
        </ul>
        <Link to="/games/o-an-quan" className="mt-4 inline-flex text-sm font-medium text-brand hover:underline">
          Chơi ô ăn quan
        </Link>
      </section>

      <section className="rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        <h2 className="font-display text-2xl">Cấp bậc Cheslax</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
          Thang {ranks.length} cấp từ Tập Sự đến Kỳ Thánh là điểm nội bộ, không phải danh hiệu thi đấu chính thức. Cờ vua
          và ô ăn quan có Elo riêng trên máy chủ.
        </p>
        <ol className="mt-4 divide-y divide-stone-100 text-sm dark:divide-stone-800">
          {ranks.map((rank) => {
            const local = RANKS.find((item) => item.id === rank.id);
            const range =
              rank.maxRating == null
                ? `${formatRating(rank.minRating)}+`
                : `${formatRating(rank.minRating)}–${formatRating(rank.maxRating)}`;
            return (
              <li key={rank.id} className="flex items-start justify-between gap-4 py-2">
                <span>
                  <span className="font-medium">
                    {rank.level}. {rank.name}
                  </span>
                  {local ? <span className="mt-0.5 block text-xs text-stone-500">{local.description}</span> : null}
                </span>
                <span className="shrink-0 font-mono text-xs text-stone-500">{range}</span>
              </li>
            );
          })}
        </ol>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link to="/profile" className="text-sm font-medium text-brand hover:underline">
            Hồ sơ
          </Link>
          <Link to="/leaderboard" className="text-sm font-medium text-brand hover:underline">
            Bảng xếp hạng
          </Link>
        </div>
      </section>
    </div>
  );
}
