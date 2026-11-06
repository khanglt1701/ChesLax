import { Link } from 'react-router-dom';

export function GuidePage() {
  return (
    <div className="prose-none mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="font-display text-4xl">Hướng dẫn</h1>
        <p className="mt-3 leading-7 text-stone-600 dark:text-stone-300">
          Cheslax Lite chơi trên một thiết bị, không cần đăng nhập hay máy chủ. Cờ vua, cờ tướng, cờ gánh và caro có thể
          đấu với máy hoặc hai người. Ô ăn quan chơi hai người. Kẻ giả mạo chơi cả bàn với một điện thoại.
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
          <li>Hai người chơi lần lượt trên cùng thiết bị. Kết quả ván lưu trên trình duyệt này.</li>
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
        <h2 className="font-display text-2xl">Cờ tướng</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-stone-600 dark:text-stone-300">
          <li>Bàn 9×10 giao điểm. Đỏ đi trước. Sông chia bàn; mỗi bên có cung 3×3.</li>
          <li>Tướng đi một bước trong cung. Hai tướng không được đối mặt trên cột trống. Sĩ đi chéo trong cung.</li>
          <li>Tượng đi chéo hai bước, không qua sông, không nhảy mắt. Mã đi chữ L và bị cản chân.</li>
          <li>Xe đi thẳng. Pháo đi như xe khi không ăn và phải nhảy đúng một quân để ăn.</li>
          <li>Tốt tiến một bước; sang sông được đi ngang, không được lùi. Chiếu hết thắng, hết nước đi thì thua.</li>
          <li>Có thể đấu với máy 3 mức Dễ, Vừa, Khó, hoặc hai người trên cùng thiết bị.</li>
        </ul>
        <Link to="/games/co-tuong" className="mt-4 inline-flex text-sm font-medium text-brand hover:underline">
          Chơi cờ tướng
        </Link>
      </section>

      <section className="rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        <h2 className="font-display text-2xl">Cờ Gánh</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-stone-600 dark:text-stone-300">
          <li>Bàn 5×5 giao điểm, đường ngang, dọc và chéo theo sơ đồ Alquerque. Đỏ đi trước, mỗi bên 8 quân trên vành bàn.</li>
          <li>Mỗi lượt đi một quân tới giao điểm trống liền kề theo đường nối. Không được nhảy hay đi xuyên.</li>
          <li>Gánh: đi vào giữa hai quân đối phương trên cùng một đường nối thì hai quân đó đổi thành quân của bạn.</li>
          <li>Vây: nhóm quân đối phương không còn đường tới điểm trống sẽ đổi màu. Bị chặn một hướng thì chưa bị vây.</li>
          <li>Thắng khi chiếm hết quân đối phương. Có thể đấu với máy hoặc hai người trên cùng thiết bị.</li>
        </ul>
        <Link to="/games/co-ganh" className="mt-4 inline-flex text-sm font-medium text-brand hover:underline">
          Chơi cờ gánh
        </Link>
      </section>

      <section className="rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        <h2 className="font-display text-2xl">Caro</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-stone-600 dark:text-stone-300">
          <li>Bàn 12×12. X đi trước. Mỗi lượt đặt một quân vào ô trống. Kích thước bàn không đổi giữa ván.</li>
          <li>
            Thắng khi có ít nhất 5 quân liên tiếp theo hàng ngang, dọc hoặc chéo, và chuỗi không bị chặn cùng lúc ở cả hai
            đầu. Quân đối phương hoặc mép bàn đều tính là một đầu bị chặn.
          </li>
          <li>Chuỗi dài hơn năm quân vẫn thắng nếu chưa bị chặn cả hai đầu. Hết ô mà không có chuỗi thắng thì hòa.</li>
          <li>Có thể đấu với máy 3 mức Dễ, Vừa, Khó, hoặc hai người trên cùng thiết bị.</li>
        </ul>
        <Link to="/games/caro" className="mt-4 inline-flex text-sm font-medium text-brand hover:underline">
          Chơi caro
        </Link>
      </section>

    </div>
  );
}
