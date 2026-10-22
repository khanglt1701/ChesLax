import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">404</p>
      <h1 className="mt-3 font-display text-4xl">Không tìm thấy trang</h1>
      <p className="mt-3 text-stone-500">Đường dẫn này không tồn tại hoặc trò chơi chưa được mở.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Về trang chủ
        </Link>
        <Link
          to="/games"
          className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium ring-1 ring-stone-300 hover:bg-stone-50 dark:bg-stone-800 dark:ring-stone-600"
        >
          Xem trò chơi
        </Link>
      </div>
    </div>
  );
}
