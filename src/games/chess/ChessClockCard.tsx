import { cn } from '@/utils/cn';
import { formatClock } from './chessClock';

interface ChessClockCardProps {
  name: string;
  color: 'w' | 'b';
  active: boolean;
  gameMs: number;
  moveMs: number;
  showGame: boolean;
  showMove: boolean;
  compact?: boolean;
  thinking?: boolean;
  variant?: 'card' | 'pill';
}

export function ChessClockCard({
  name,
  color,
  active,
  gameMs,
  moveMs,
  showGame,
  showMove,
  compact = false,
  thinking = false,
  variant = 'card',
}: ChessClockCardProps) {
  const primaryMs = showGame ? gameMs : moveMs;
  const low = (showGame && gameMs > 0 && gameMs <= 20_000) || (showMove && moveMs > 0 && moveMs <= 10_000);

  if (variant === 'pill') {
    return (
      <div
        aria-label={`${name} ${formatClock(primaryMs)}`}
        className={cn(
          'inline-flex min-w-[5.5rem] items-center justify-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-base font-semibold tabular-nums ring-1 sm:min-w-[6.5rem] sm:px-3 sm:py-1.5 sm:text-lg',
          color === 'w'
            ? 'bg-[#f7f1e6] text-stone-900 ring-stone-300 dark:bg-[#f3ead8] dark:ring-[#cbbda8]'
            : 'bg-[#2b2620] text-[#f7f1e6] ring-stone-600 dark:bg-[#1f1b17] dark:ring-[#6b6156]',
          active ? 'ring-2 ring-brand brightness-100' : 'opacity-80',
        )}
      >
        <span
          className={cn(
            'h-2.5 w-2.5 shrink-0 rounded-full',
            color === 'w' ? 'bg-white ring-1 ring-stone-400' : 'bg-stone-900 ring-1 ring-stone-500',
          )}
        />
        <span className={cn(low && 'animate-clock-low text-rose-500')}>{formatClock(primaryMs)}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ring-1 transition duration-200',
        color === 'w'
          ? 'bg-[#f7f1e6] text-stone-900 ring-stone-300 dark:bg-[#f3ead8] dark:ring-[#cbbda8]'
          : 'bg-[#2b2620] text-[#f7f1e6] ring-stone-600 dark:bg-[#1f1b17] dark:ring-[#6b6156]',
        active ? 'ring-2 ring-brand shadow-md brightness-100' : 'opacity-75',
        compact && 'px-3 py-2',
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'h-2.5 w-2.5 shrink-0 rounded-full',
              color === 'w' ? 'bg-white ring-1 ring-stone-400' : 'bg-stone-900 ring-1 ring-stone-500',
            )}
          />
          <p className="truncate text-sm font-semibold">{name}</p>
        </div>
        <p className={cn('mt-0.5 h-4 truncate pl-5 text-[11px] font-medium tracking-wide', thinking ? 'opacity-90' : 'invisible')}>
          Đang nghĩ…
        </p>
      </div>
      {showGame || showMove ? (
        <div className="text-right">
          <p
            className={cn(
              'font-mono text-3xl font-semibold tabular-nums tracking-tight',
              compact && 'text-2xl',
              low && 'animate-clock-low text-rose-500',
            )}
          >
            {formatClock(primaryMs)}
          </p>
          {showGame && showMove ? (
            <p className={cn('mt-0.5 font-mono text-xs tabular-nums', moveMs <= 10_000 && moveMs > 0 ? 'text-rose-400' : 'opacity-70')}>
              Nước đi {formatClock(moveMs)}
            </p>
          ) : showMove && !showGame ? (
            <p className="mt-0.5 text-[11px] uppercase tracking-wide opacity-60">Mỗi nước</p>
          ) : (
            <p className="mt-0.5 text-[11px] uppercase tracking-wide opacity-60">Tổng giờ</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
