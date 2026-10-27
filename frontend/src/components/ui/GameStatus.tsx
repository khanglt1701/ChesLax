import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface GameStatusProps {
  label: string;
  tone?: 'neutral' | 'warning' | 'success' | 'danger';
  trailing?: ReactNode;
}

const tones = {
  neutral: 'bg-stone-100 text-stone-800 dark:bg-[#3a322a] dark:text-[#f3ece3]',
  warning: 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-100',
  success: 'bg-teal-100 text-teal-900 dark:bg-teal-950/70 dark:text-teal-100',
  danger: 'bg-rose-100 text-rose-900 dark:bg-rose-950/55 dark:text-rose-100',
};

export function GameStatus({ label, tone = 'neutral', trailing }: GameStatusProps) {
  return (
    <p className={cn('flex min-h-10 items-center rounded-xl px-3 py-2 text-sm font-medium', tones[tone])}>
      <span className="min-w-0 flex-1">{label}</span>
      {trailing}
    </p>
  );
}
