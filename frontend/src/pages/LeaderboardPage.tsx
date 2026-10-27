import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlayerAvatar } from '@/components/ranking/PlayerAvatar';
import { RankBadge } from '@/components/ranking/RankBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRating, getRankByRating } from '@/ranking/rankService';
import type { RatedGameId } from '@/ranking/ratingTypes';
import { getLeaderboard, LEADERBOARD_PAGE_SIZE } from '@/services/leaderboardService';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

const TABS: { id: RatedGameId; label: string }[] = [
  { id: 'chess', label: 'Cờ vua' },
  { id: 'caro', label: 'Caro' },
  { id: 'o-an-quan', label: 'Ô ăn quan' },
];

export function LeaderboardPage() {
  const auth = useAuthStore();
  const [gameId, setGameId] = useState<RatedGameId>('chess');
  const [pageSize, setPageSize] = useState(LEADERBOARD_PAGE_SIZE);
  const query = useQuery({
    queryKey: ['leaderboard', gameId, pageSize, auth.status],
    queryFn: () => getLeaderboard(gameId, 1, pageSize),
  });
  const board = query.data;
  const current = board?.you;
  const shown = board?.items ?? [];
  const hasMore = board ? board.items.length < board.totalCount : false;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Xếp hạng</p>
        <h1 className="mt-1 font-display text-4xl">Bảng xếp hạng</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
          Elo lấy từ máy chủ Cheslax. Chỉ ván online đã xác thực mới làm thay đổi thứ hạng.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setGameId(tab.id);
              setPageSize(LEADERBOARD_PAGE_SIZE);
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
          Bạn đang đứng hạng {current.rank} · {formatRating(current.rating)} Elo.{' '}
          <Link to="/profile" className="font-medium text-brand hover:underline">
            Mở hồ sơ
          </Link>
        </p>
      ) : auth.status === 'guest' ? (
        <p className="rounded-2xl bg-stone-100 px-4 py-3 text-sm text-stone-600 dark:bg-stone-800 dark:text-stone-300">
          <Link to="/login" className="font-medium text-brand hover:underline">
            Đăng nhập
          </Link>{' '}
          để thấy vị trí của bạn trên bảng xếp hạng.
        </p>
      ) : null}

      {query.isError ? (
        <EmptyState title="Không tải được bảng xếp hạng" message="Kiểm tra kết nối máy chủ rồi thử lại." />
      ) : shown.length === 0 && !query.isLoading ? (
        <EmptyState title="Chưa có kỳ thủ" message="Đăng ký tài khoản và chơi ván online để xuất hiện tại đây." />
      ) : (
        <ol className="overflow-hidden rounded-3xl bg-white ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
          {shown.map((row) => {
            const rank = getRankByRating(row.rating);
            const isYou = current?.username === row.username;
            return (
              <li
                key={row.username}
                className={cn(
                  'flex items-center gap-4 border-b border-stone-100 px-5 py-4 last:border-b-0 dark:border-stone-800',
                  isYou && 'bg-brand/5',
                )}
              >
                <span className="w-8 font-mono text-sm text-stone-400">{row.rank}</span>
                <PlayerAvatar avatarId={row.avatarId} name={row.displayName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    <Link to={`/profile/${encodeURIComponent(row.username)}`} className="hover:underline">
                      {row.displayName}
                    </Link>
                    {isYou ? (
                      <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-brand">Bạn</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-stone-500">{row.gamesPlayed} ván</p>
                </div>
                <RankBadge rank={rank} size="sm" showName />
                <p className="w-16 text-right font-mono font-semibold tabular-nums">{formatRating(row.rating)}</p>
              </li>
            );
          })}
        </ol>
      )}

      {hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setPageSize((value) => value + LEADERBOARD_PAGE_SIZE)}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium ring-1 ring-stone-300 hover:bg-stone-50 dark:bg-stone-800 dark:ring-stone-600"
          >
            Tải thêm
          </button>
        </div>
      ) : null}
    </div>
  );
}
