import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { t } from '@/i18n/t';
import { isSuperAdmin } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

const tabs = [
  { to: '/admin', key: 'admin.overview', end: true },
  { to: '/admin/users', key: 'admin.users', end: false },
  { to: '/admin/matches', key: 'admin.matches', end: false },
  { to: '/admin/rooms', key: 'admin.rooms', end: false },
] as const;

export function AdminLayout() {
  const location = useLocation();
  const auth = useAuthStore();

  useEffect(() => {
    if (auth.status === 'unknown') void auth.refresh();
  }, [auth]);

  if (auth.status === 'unknown') {
    return <p className="text-sm text-stone-500">{t('admin.checking')}</p>;
  }

  if (!isSuperAdmin(auth.user)) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">{t('admin.badge')}</p>
        <h1 className="mt-3 font-display text-4xl">{t('admin.forbiddenTitle')}</h1>
        <p className="mt-3 text-stone-500">{t('admin.forbiddenBody')}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/login"
            state={{ from: location.pathname }}
            className="inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            {t('nav.login')}
          </Link>
          <Link
            to="/"
            className="inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-medium ring-1 ring-stone-300 dark:bg-stone-800 dark:ring-stone-600"
          >
            {t('notFound.home')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">{t('admin.badge')}</p>
        <h1 className="mt-1 font-display text-4xl">{t('admin.title')}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">{t('admin.subtitle')}</p>
      </div>
      <nav className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'rounded-full px-4 py-2 text-sm font-medium ring-1 transition',
                isActive
                  ? 'bg-brand text-white ring-brand'
                  : 'bg-white text-stone-600 ring-stone-300 hover:bg-stone-50 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-600',
              )
            }
          >
            {t(tab.key)}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
