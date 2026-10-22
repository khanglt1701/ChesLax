import { cn } from '@/utils/cn';

interface PlayerInfoProps {
  name: string;
  detail?: string;
  active?: boolean;
}

export function PlayerInfo({ name, detail, active = false }: PlayerInfoProps) {
  return (
    <div
      className={cn(
        'rounded-2xl px-4 py-3 ring-1 transition',
        active
          ? 'bg-brand/10 ring-brand dark:bg-teal-400/10'
          : 'bg-white/70 ring-stone-200 dark:bg-stone-800/70 dark:ring-stone-700',
      )}
    >
      <p className="text-sm font-semibold text-ink dark:text-paper">{name}</p>
      {detail ? <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{detail}</p> : null}
      {active ? (
        <p className="mt-2 text-xs font-medium uppercase tracking-wider text-brand">Đang đến lượt</p>
      ) : null}
    </div>
  );
}
