import { RankBadge } from '@/components/ranking/RankBadge';
import { RankProgress } from '@/components/ranking/RankProgress';
import { formatRating, getRankByRating } from '@/ranking/rankService';
import type { PlayerGameRating } from '@/ranking/ratingTypes';

interface GameRatingPanelProps {
  rating: PlayerGameRating;
  gameLabel: string;
  opponentName?: string;
  opponentRating?: number;
  ratedMatch: boolean;
}

export function GameRatingPanel({
  rating,
  gameLabel,
  opponentName,
  opponentRating,
  ratedMatch,
}: GameRatingPanelProps) {
  const rank = getRankByRating(rating.rating);
  const opponentRank = opponentRating === undefined ? null : getRankByRating(opponentRating);

  return (
    <div className="space-y-3">
      <RankProgress rating={rating.rating} compact gameLabel={gameLabel} />
      {ratedMatch && opponentName && opponentRating !== undefined && opponentRank ? (
        <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm ring-1 ring-stone-200 dark:bg-[#2c261f] dark:ring-[#5c5348]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">Đối thủ</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{opponentName}</p>
              <p className="text-xs text-stone-500">{formatRating(opponentRating)} Elo</p>
            </div>
            <RankBadge rank={opponentRank} size="sm" showName />
          </div>
        </div>
      ) : (
        <p className="rounded-2xl bg-stone-100 px-4 py-3 text-xs leading-5 text-stone-600 dark:bg-[#3a322a] dark:text-[#d8cbb8]">
          {ratedMatch
            ? 'Ván này tính điểm Elo, lưu trên thiết bị, chưa xác minh bởi máy chủ.'
            : 'Ván hai người trên cùng thiết bị không tính điểm xếp hạng.'}
        </p>
      )}
      <p className="sr-only">
        {rank.name}, {formatRating(rating.rating)} điểm
      </p>
    </div>
  );
}
