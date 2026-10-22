import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { PlayerAvatar } from '@/components/ranking/PlayerAvatar';
import { RankBadge } from '@/components/ranking/RankBadge';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { t } from '@/i18n/t';
import { featuredGameRating } from '@/ranking/ratingEngine';
import { getRankByRating } from '@/ranking/rankService';
import { useRatingStore } from '@/ranking/ratingStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

const links = [
  { to: '/', key: 'nav.home' },
  { to: '/games', key: 'nav.games' },
  { to: '/online', key: 'nav.online' },
  { to: '/leaderboard', key: 'nav.leaderboard' },
  { to: '/huong-dan', key: 'nav.guide' },
  { to: '/thong-ke', key: 'nav.stats' },
] as const;

export function AppHeader() {
  const [open, setOpen] = useState(false);
  const player = useRatingStore((state) => state.player);
  const ratings = useRatingStore((state) => state.ratings);
  const auth = useAuthStore();
  const featured = featuredGameRating(ratings);
  const rank = getRankByRating(featured.rating);

  useEffect(() => {
    if (auth.status === 'unknown') void auth.refresh();
  }, [auth]);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-paper/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <NavLink to="/" aria-label={`${t('brand.name')} — ${t('nav.home')}`} className="shrink-0">
          <Logo />
        </NavLink>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-xl px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-brand/10 text-brand'
                    : 'text-stone-600 hover:bg-black/5 dark:text-stone-300 dark:hover:bg-white/10',
                )
              }
            >
              {t(link.key)}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {auth.status === 'authenticated' && auth.user ? (
            <NavLink
              to="/profile"
              className="hidden items-center gap-2 rounded-full py-1 pr-2 pl-1 hover:bg-black/5 sm:inline-flex dark:hover:bg-white/10"
              aria-label={t('nav.profile')}
            >
              <PlayerAvatar avatarId={auth.user.avatarId} name={auth.user.displayName} size="sm" />
              <RankBadge rank={rank} size="sm" />
            </NavLink>
          ) : (
            <>
              <NavLink
                to="/profile"
                className="hidden items-center gap-2 rounded-full py-1 pr-2 pl-1 hover:bg-black/5 sm:inline-flex dark:hover:bg-white/10"
                aria-label={t('nav.profile')}
              >
                <PlayerAvatar avatarId={player.avatarId} name={player.name} size="sm" />
                <RankBadge rank={rank} size="sm" />
              </NavLink>
              <NavLink
                to="/login"
                className="hidden rounded-xl px-3 py-2 text-sm font-medium text-stone-600 hover:bg-black/5 sm:inline-flex dark:text-stone-300"
              >
                {t('nav.login')}
              </NavLink>
            </>
          )}
          <NavLink
            to="/settings"
            className="hidden rounded-xl px-3 py-2 text-sm font-medium text-stone-600 hover:bg-black/5 md:inline-flex dark:text-stone-300"
          >
            {t('nav.settings')}
          </NavLink>
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-stone-300 md:hidden dark:ring-stone-600"
            aria-label="Mở menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      {open ? (
        <nav className="border-t border-stone-200 px-4 py-3 md:hidden dark:border-stone-800">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-3 py-2 text-sm font-medium',
                    isActive ? 'bg-brand/10 text-brand' : 'text-stone-600 dark:text-stone-300',
                  )
                }
              >
                {t(link.key)}
              </NavLink>
            ))}
            <NavLink to="/settings" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-stone-600 dark:text-stone-300">
              {t('nav.settings')}
            </NavLink>
            <NavLink to="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-stone-600 dark:text-stone-300">
              {t('nav.login')}
            </NavLink>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
