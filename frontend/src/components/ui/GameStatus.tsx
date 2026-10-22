import { cn } from '@/utils/cn';

interface GameStatusProps {
  label: string;
  tone?: 'neutral' | 'warning' | 'success' | 'danger';
}

const tones = {
  neutral: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  success: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
  danger: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
};

export function GameStatus({ label, tone = 'neutral' }: GameStatusProps) {
  return (
    <p className={cn('rounded-xl px-3 py-2 text-sm font-medium', tones[tone])}>{label}</p>
  );
}
