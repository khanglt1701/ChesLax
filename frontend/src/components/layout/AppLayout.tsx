import { Outlet } from 'react-router-dom';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink dark:bg-[#161310] dark:text-paper">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
