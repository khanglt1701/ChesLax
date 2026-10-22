import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface GameBoardLayoutProps {
  title: string;
  subtitle?: string;
  board: ReactNode;
  sidebar: ReactNode;
  controls: ReactNode;
  guide?: ReactNode;
}

export function GameBoardLayout({ title, subtitle, board, sidebar, controls, guide }: GameBoardLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/games" className="text-sm font-medium text-brand hover:underline">
            ← Danh sách trò chơi
          </Link>
          <h1 className="mt-2 font-display text-3xl text-ink dark:text-paper">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-stone-500">{subtitle}</p> : null}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl bg-white/80 p-3 shadow-sm ring-1 ring-stone-200 sm:p-5 dark:bg-stone-900/60 dark:ring-stone-700">
            {board}
          </div>
          <div className="flex flex-wrap gap-2">{controls}</div>
          {guide}
        </div>
        <aside className="space-y-4">{sidebar}</aside>
      </div>
    </div>
  );
}
