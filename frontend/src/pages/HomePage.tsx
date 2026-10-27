import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlayerProfileCard } from '@/components/ranking/PlayerProfileCard';
import { GameCard } from '@/components/ui/GameCard';
import { useCatalogGames } from '@/hooks/useCatalogGames';
import { t } from '@/i18n/t';
import { getApiHealth } from '@/services/healthService';
import { useAuthStore } from '@/store/authStore';
import { useStatsStore } from '@/store/statsStore';

function formatTime(value: number): string {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(value);
}

export function HomePage() {
  const chess = useStatsStore((state) => state.chess);
  const oAnQuan = useStatsStore((state) => state.oAnQuan);
  const caro = useStatsStore((state) => state.caro);
  const recent = useStatsStore((state) => state.recent);
  const totalPlayed = chess.played + oAnQuan.played + caro.played;
  const { games, available: featured } = useCatalogGames();
  const auth = useAuthStore();
  const health = useQuery({ queryKey: ['api-health'], queryFn: getApiHealth, retry: false });

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">{t('brand.tagline')}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl dark:text-paper">
            {t('home.heroTitle')}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-stone-600 dark:text-stone-300">{t('home.heroBody')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={featured[0]?.path ?? '/games'}
              className="inline-flex rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
            >
              {t('home.playChess')}
            </Link>
            <Link
              to="/games/o-an-quan"
              className="inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-medium ring-1 ring-stone-300 hover:bg-stone-50 dark:bg-stone-800 dark:ring-stone-600"
            >
              {t('home.playOAnQuan')}
            </Link>
            <Link
              to="/games/caro"
              className="inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-medium ring-1 ring-stone-300 hover:bg-stone-50 dark:bg-stone-800 dark:ring-stone-600"
            >
              {t('home.playCaro')}
            </Link>
            <Link
              to="/online"
              className="inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-medium ring-1 ring-stone-300 hover:bg-stone-50 dark:bg-stone-800 dark:ring-stone-600"
            >
              {t('home.playFriends')}
            </Link>
          </div>
          {auth.status !== 'authenticated' ? (
            <p className="mt-4 text-sm text-stone-500">
              {t('home.signInPrompt')}{' '}
              <Link to="/login" className="font-medium text-brand hover:underline">
                {t('nav.login')}
              </Link>
              {' · '}
              {t('home.guestHint')}
            </p>
          ) : null}
          <p className="mt-3 text-xs text-stone-400">{health.data?.ok ? t('home.apiUp') : t('home.apiDown')}</p>
        </div>
        <div className="rounded-[2rem] bg-gradient-to-br from-teal-700 to-teal-900 p-6 text-paper shadow-lg">
          <p className="font-display text-2xl">Cheslax</p>
          <p className="mt-2 text-sm text-teal-100">Cờ vua · Caro · Ô ăn quan · Sắp có Sudoku</p>
          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white/10 p-4">
              <dt className="text-teal-100">Ván đã chơi</dt>
              <dd className="mt-1 font-display text-3xl">{totalPlayed}</dd>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <dt className="text-teal-100">Trò chơi mở</dt>
              <dd className="mt-1 font-display text-3xl">{featured.length}</dd>
            </div>
          </dl>
        </div>
      </section>

      <PlayerProfileCard />

      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl">{t('home.gamesHeading')}</h2>
            <p className="mt-1 text-sm text-stone-500">{t('home.gamesSub')}</p>
          </div>
          <Link to="/games" className="text-sm font-medium text-brand hover:underline">
            Xem tất cả
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
          <h2 className="font-display text-2xl">Thống kê nhanh</h2>
          {totalPlayed === 0 ? (
            <p className="mt-3 text-sm text-stone-500">Chưa có dữ liệu. Hãy chơi một ván để bắt đầu ghi nhận.</p>
          ) : (
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-stone-500">Cờ vua</dt>
                <dd className="mt-1 font-medium">{chess.played} ván</dd>
              </div>
              <div>
                <dt className="text-stone-500">Caro</dt>
                <dd className="mt-1 font-medium">{caro.played} ván</dd>
              </div>
              <div>
                <dt className="text-stone-500">Ô ăn quan</dt>
                <dd className="mt-1 font-medium">{oAnQuan.played} ván</dd>
              </div>
            </dl>
          )}
        </div>
        <div className="rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
          <h2 className="font-display text-2xl">Trò chơi gần đây</h2>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">Các ván vừa kết thúc sẽ xuất hiện tại đây.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {recent.slice(0, 4).map((item) => (
                <li key={`${item.at}-${item.gameId}`} className="flex items-start justify-between gap-3">
                  <span>
                    <span className="font-medium">{item.gameName}</span>
                    <span className="block text-stone-500">{item.result}</span>
                  </span>
                  <time className="shrink-0 text-xs text-stone-400">{formatTime(item.at)}</time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
