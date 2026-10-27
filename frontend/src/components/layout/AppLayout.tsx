import { Outlet } from 'react-router-dom';
import { PreferenceSync } from '@/components/settings/PreferenceSync';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink dark:bg-[#1c1814] dark:text-[#f3ece3]">
      <PreferenceSync />
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
