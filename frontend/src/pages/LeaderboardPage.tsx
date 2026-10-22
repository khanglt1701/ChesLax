import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlayerAvatar } from '@/components/ranking/PlayerAvatar';
import { RankBadge } from '@/components/ranking/RankBadge';
import { buildLeaderboard, LEADERBOARD_PAGE_SIZE } from '@/ranking/demoLeaderboard';
import { formatRating, getRankByRating } from '@/ranking/rankService';
import { useRatingStore } from '@/ranking/ratingStore';
import type { RatedGameId } from '@/ranking/ratingTypes';
import { cn } from '@/utils/cn';

const TABS: { id: RatedGameId; label: string }[] = [
  { id: 'chess', label: 'Cờ vua' },
  { id: 'o-an-quan', label: 'Ô ăn quan' },
];

export function LeaderboardPage() {
  const player = useRatingStore((state) => state.player);
  const ratings = useRatingStore((state) => state.ratings);
  const [gameId, setGameId] = useState<RatedGameId>('chess');
  const [visible, setVisible] = useState(LEADERBOARD_PAGE_SIZE);
  const rows = useMemo(
    () => buildLeaderboard(gameId, player, ratings[gameId]),
    [gameId, player, ratings],
  );
  const shown = rows.slice(0, visible);
  const current = rows.find((row) => row.isCurrentPlayer);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Xếp hạng</p>
        <h1 className="mt-1 font-display text-4xl">Bảng xếp hạng</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
          Dữ liệu demo được trộn với Elo trên thiết bị của bạn. Chưa có mùa giải online hay bảng xếp hạng toàn hệ thống.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setGameId(tab.id);
              setVisible(LEADERBOARD_PAGE_SIZE);
            }}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium ring-1 transition',
              gameId === tab.id
                ? 'bg-brand text-white ring-brand'
                : 'bg-white text-stone-600 ring-stone-300 hover:bg-stone-50 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-600',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {current ? (
        <p className="rounded-2xl bg-brand/10 px-4 py-3 text-sm text-stone-700 dark:text-stone-200">
          Bạn đang đứng hạng {current.rankIndex} · {formatRating(current.rating)} Elo.{' '}
          <Link to="/profile" className="font-medium text-brand hover:underline">
            Mở hồ sơ
          </Link>
        </p>
      ) : null}

      <ol className="overflow-hidden rounded-3xl bg-white ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        {shown.map((row) => {
          const rank = getRankByRating(row.rating);
          return (
            <li
              key={row.id}
              className={cn(
                'flex items-center gap-4 border-b border-stone-100 px-5 py-4 last:border-b-0 dark:border-stone-800',
                row.isCurrentPlayer && 'bg-brand/5',
              )}
            >
              <span className="w-8 font-mono text-sm text-stone-400">{row.rankIndex}</span>
              <PlayerAvatar avatarId={row.avatarId} name={row.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {row.name}
                  {row.isCurrentPlayer ? (
                    <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-brand">Bạn</span>
                  ) : null}
                  {row.isDemo ? <span className="ml-2 text-xs text-stone-400">demo</span> : null}
                </p>
                <p className="text-xs text-stone-500">{row.gamesPlayed} ván</p>
              </div>
              <RankBadge rank={rank} size="sm" showName />
              <p className="w-16 text-right font-mono font-semibold tabular-nums">{formatRating(row.rating)}</p>
            </li>
          );
        })}
      </ol>

      {visible < rows.length ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((value) => value + LEADERBOARD_PAGE_SIZE)}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium ring-1 ring-stone-300 hover:bg-stone-50 dark:bg-stone-800 dark:ring-stone-600"
          >
            Tải thêm
          </button>
        </div>
      ) : null}
    </div>
  );
}
