import { Link } from 'react-router-dom';
import { PlayerAvatar } from '@/components/ranking/PlayerAvatar';
import { RankBadge } from '@/components/ranking/RankBadge';
import { featuredGameRating } from '@/ranking/ratingEngine';
import { formatRating, getRankByRating } from '@/ranking/rankService';
import { useRatingStore } from '@/ranking/ratingStore';

export function PlayerProfileCard() {
  const player = useRatingStore((state) => state.player);
  const ratings = useRatingStore((state) => state.ratings);
  const featured = featuredGameRating(ratings);
  const rank = getRankByRating(featured.rating);
  const gamesPlayed = ratings.chess.gamesPlayed + ratings['o-an-quan'].gamesPlayed;

  return (
    <section className="rounded-[2rem] bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <PlayerAvatar avatarId={player.avatarId} name={player.name} size="lg" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Hồ sơ nhanh</p>
            <h2 className="font-display text-2xl">{player.name}</h2>
            <RankBadge rank={rank} size="sm" showName showLevel className="mt-1" />
          </div>
        </div>
        <Link to="/profile" className="text-sm font-medium text-brand hover:underline">
          Xem hồ sơ
        </Link>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <Stat label="Cờ vua" value={formatRating(ratings.chess.rating)} />
        <Stat label="Ô ăn quan" value={formatRating(ratings['o-an-quan'].rating)} />
        <Stat label="Ván xếp hạng" value={String(gamesPlayed)} />
      </dl>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-3 dark:bg-stone-800">
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-1 font-display text-xl">{value}</dd>
    </div>
  );
}
