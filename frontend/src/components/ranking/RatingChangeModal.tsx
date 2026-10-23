import { RankBadge } from '@/components/ranking/RankBadge';
import { Button } from '@/components/ui/Button';
import { t } from '@/i18n/t';
import { formatRating } from '@/ranking/rankService';
import type { RatingChange } from '@/ranking/ratingTypes';
import { cn } from '@/utils/cn';

interface RatingChangeModalProps {
  open: boolean;
  title: string;
  message: string;
  change: RatingChange | null;
  unratedNote?: string;
  contained?: boolean;
  authoritative?: boolean;
  opponentType?: 'ai' | 'human';
  aiDifficultyLabel?: string | null;
  onPlayAgain: () => void;
  onClose: () => void;
}

export function RatingChangeModal({
  open,
  title,
  message,
  change,
  unratedNote,
  contained = false,
  authoritative = false,
  opponentType,
  aiDifficultyLabel,
  onPlayAgain,
  onClose,
}: RatingChangeModalProps) {
  if (!open) return null;
  const deltaLabel = change ? (change.delta > 0 ? `+${change.delta}` : String(change.delta)) : null;
  const resultLabel = change?.result === 'win' ? 'Thắng' : change?.result === 'loss' ? 'Thua' : change ? 'Hòa' : null;

  return (
    <div
      className={cn(
        'inset-0 z-50 flex items-center justify-center bg-black/40 p-4',
        contained ? 'absolute' : 'fixed',
      )}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rating-result-title"
        className={cn(
          'w-full max-w-md rounded-2xl bg-paper p-6 text-center shadow-xl dark:bg-stone-900',
          change?.reachedMaxRank && 'rank-max-glow',
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Kết quả</p>
        <h2 id="rating-result-title" className="mt-2 font-display text-3xl text-ink dark:text-paper">
          {title}
        </h2>
        {resultLabel && change ? (
          <p className="mt-2 text-sm font-medium text-stone-500">
            {resultLabel} trước {change.opponentName}
          </p>
        ) : null}
        <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">{message}</p>

        {change ? (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-center gap-4">
              <RankBadge rank={change.oldRankId} size="md" showName />
              <span className="text-stone-400">→</span>
              <RankBadge rank={change.newRankId} size="md" showName />
            </div>
            <p className="font-mono text-2xl tabular-nums">
              {formatRating(change.oldRating)}{' '}
              <span className={change.delta >= 0 ? 'text-teal-600' : 'text-rose-600'}>{deltaLabel}</span>
              {' → '}
              {formatRating(change.newRating)}
            </p>
            <dl className="grid grid-cols-2 gap-2 text-left text-xs text-stone-500">
              <div>
                <dt>{t('play.startingElo')}</dt>
                <dd className="font-mono text-sm text-stone-800 dark:text-stone-100">{formatRating(change.oldRating)}</dd>
              </div>
              <div>
                <dt>{t('play.eloChange')}</dt>
                <dd className="font-mono text-sm text-stone-800 dark:text-stone-100">{deltaLabel}</dd>
              </div>
              <div>
                <dt>{t('play.newElo')}</dt>
                <dd className="font-mono text-sm text-stone-800 dark:text-stone-100">{formatRating(change.newRating)}</dd>
              </div>
              <div>
                <dt>{opponentType === 'ai' || change.opponentType === 'ai' ? t('play.opponentTypeAi') : t('play.opponentTypeHuman')}</dt>
                <dd className="text-sm text-stone-800 dark:text-stone-100">
                  {aiDifficultyLabel ?? change.aiDifficultyLabel ?? change.opponentName}
                </dd>
              </div>
            </dl>
            {change.promoted ? (
              <p className="rounded-xl bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800 dark:bg-teal-950/50 dark:text-teal-200">
                Thăng hạng! Bạn đã đạt cấp mới.
              </p>
            ) : null}
            {change.demoted ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                Tụt hạng. Một ván nữa để lấy lại phong độ.
              </p>
            ) : null}
            {change.reachedMaxRank ? (
              <p className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-medium text-amber-900 dark:bg-amber-950/60 dark:text-amber-100">
                Kỳ Thánh. Bạn đã đứng trên đỉnh thang điểm Cheslax.
              </p>
            ) : null}
            {authoritative ? (
              <p className="text-[11px] leading-5 text-stone-400">Elo được máy chủ ghi nhận sau ván xếp hạng hợp lệ.</p>
            ) : (
              <p className="text-[11px] leading-5 text-stone-400">
                Điểm Elo lưu trên thiết bị này, chưa được máy chủ xác minh.
              </p>
            )}
          </div>
        ) : unratedNote ? (
          <p className="mt-4 rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-600 dark:bg-stone-800 dark:text-stone-300">
            {unratedNote}
          </p>
        ) : null}

        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          <Button onClick={onPlayAgain}>Chơi lại</Button>
        </div>
      </div>
    </div>
  );
}
