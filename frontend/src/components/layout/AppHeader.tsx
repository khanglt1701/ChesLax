import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { t } from '@/i18n/t';
import { shownName, usePlayerStore } from '@/store/playerStore';
import { cn } from '@/utils/cn';

const links = [
  { to: '/', key: 'nav.home' },
  { to: '/games', key: 'nav.games' },
  { to: '/huong-dan', key: 'nav.guide' },
  { to: '/thong-ke', key: 'nav.stats' },
] as const;

export function AppHeader() {
  const [open, setOpen] = useState(false);
  const players = usePlayerStore((state) => state.players);
  const label = `${shownName(players.player1, 'Người chơi 1')} · ${shownName(players.player2, 'Người chơi 2')}`;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-paper/90 backdrop-blur dark:border-[#3d362f] dark:bg-[#221c18]/90">
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
                    : 'text-stone-600 hover:bg-black/5 dark:text-[#d8cbb8] dark:hover:bg-white/10',
                )
              }
            >
              {t(link.key)}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <NavLink
            to="/settings"
            className="hidden max-w-40 truncate rounded-full px-3 py-2 text-sm font-medium text-stone-600 hover:bg-black/5 sm:inline-flex dark:text-[#d8cbb8] dark:hover:bg-white/10"
            title={label}
          >
            {label}
          </NavLink>
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
          </div>
        </nav>
      ) : null}
    </header>
  );
}
