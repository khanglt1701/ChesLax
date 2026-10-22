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
}: ChessClockCardProps) {
  const primaryMs = showGame ? gameMs : moveMs;
  const low = (showGame && gameMs > 0 && gameMs <= 20_000) || (showMove && moveMs > 0 && moveMs <= 10_000);

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ring-1 transition duration-200',
        color === 'w'
          ? 'bg-[#f7f1e6] text-stone-900 ring-stone-300'
          : 'bg-[#2b2620] text-[#f7f1e6] ring-stone-700',
        active ? 'ring-2 ring-brand shadow-md brightness-100' : 'opacity-40 saturate-50',
        compact && 'px-3 py-2',
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              color === 'w' ? 'bg-white ring-1 ring-stone-400' : 'bg-stone-900 ring-1 ring-stone-500',
            )}
          />
          <p className="truncate text-sm font-semibold">{name}</p>
        </div>
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
