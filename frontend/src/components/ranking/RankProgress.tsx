import { RankBadge } from '@/components/ranking/RankBadge';
import { getNextRank, getRankByRating, getRatingProgress, getRatingToNextRank, formatRating } from '@/ranking/rankService';
import { cn } from '@/utils/cn';

interface RankProgressProps {
  rating: number;
  compact?: boolean;
  gameLabel?: string;
}

export function RankProgress({ rating, compact = false, gameLabel }: RankProgressProps) {
  const current = getRankByRating(rating);
  const next = getNextRank(rating);
  const progress = getRatingProgress(rating);
  const remaining = getRatingToNextRank(rating);

  return (
    <div
      className={cn(
        'rounded-2xl bg-white/80 p-4 ring-1 ring-stone-200 dark:bg-[#2c261f] dark:ring-[#5c5348]',
        compact && 'p-3',
      )}
    >
      {gameLabel ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">{gameLabel}</p>
      ) : null}
      <div className="mt-2 flex items-center justify-between gap-3">
        <RankBadge rank={current} size={compact ? 'sm' : 'md'} showName showLevel />
        <p className="font-mono text-lg font-semibold tabular-nums">{formatRating(rating)}</p>
      </div>
      {next ? (
        <>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${progress}%`, backgroundColor: current.color }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-stone-500 dark:text-[#cbbda8]">
            <span>
              Còn {formatRating(remaining)} điểm đến {next.name}
            </span>
            <RankBadge rank={next} size="sm" />
          </div>
        </>
      ) : (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Kỳ Thánh — cấp cao nhất trên thang điểm Cheslax.
        </p>
      )}
    </div>
  );
}
