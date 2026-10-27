import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white/60 dark:border-[#3d362f] dark:bg-[#221c18]/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-2 text-sm text-stone-500 dark:text-[#cbbda8]">Play. Relax. Repeat.</p>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm text-stone-600 dark:text-stone-300">
          <Link to="/" className="hover:text-brand">
            Trang chủ
          </Link>
          <Link to="/games" className="hover:text-brand">
            Trò chơi
          </Link>
          <Link to="/huong-dan" className="hover:text-brand">
            Hướng dẫn
          </Link>
          <Link to="/thong-ke" className="hover:text-brand">
            Thống kê
          </Link>
          <Link to="/profile" className="hover:text-brand">
            Hồ sơ
          </Link>
          <Link to="/settings" className="hover:text-brand">
            Cài đặt
          </Link>
          <Link to="/login" className="hover:text-brand">
            Đăng nhập
          </Link>
          <Link to="/leaderboard" className="hover:text-brand">
            Xếp hạng
          </Link>
        </nav>
        <p className="text-xs text-stone-400">© {new Date().getFullYear()} Cheslax. Chơi ngay trên trình duyệt.</p>
      </div>
    </footer>
  );
}
