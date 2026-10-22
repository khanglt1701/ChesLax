import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlayerAvatar } from '@/components/ranking/PlayerAvatar';
import { RankBadge } from '@/components/ranking/RankBadge';
import { RankProgress } from '@/components/ranking/RankProgress';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { AVATAR_IDS, featuredGameRating, winRate } from '@/ranking/ratingEngine';
import { formatRating, getRankByRating } from '@/ranking/rankService';
import { useRatingStore } from '@/ranking/ratingStore';
import type { EloResult } from '@/ranking/eloService';
import type { PlayerGameRating, RatingHistoryEntry } from '@/ranking/ratingTypes';
import { ApiError } from '@/services/apiClient';
import { getMyProfile, getPublicProfile, mapProfileHistory, mapProfileRatings, updateMyProfile } from '@/services/profileService';
import { useAuthStore } from '@/store/authStore';

export function PlayerProfile({ username }: { username?: string }) {
  const queryClient = useQueryClient();
  const auth = useAuthStore();
  const localPlayer = useRatingStore((state) => state.player);
  const localRatings = useRatingStore((state) => state.ratings);
  const localHistory = useRatingStore((state) => state.history);
  const seasonId = useRatingStore((state) => state.seasonId);
  const updateLocalPlayer = useRatingStore((state) => state.updatePlayer);
  const resetLocalRatings = useRatingStore((state) => state.resetLocalRatings);

  const isPublic = Boolean(username);
  const isOwnApi = !isPublic && auth.status === 'authenticated';
  const isGuestLocal = !isPublic && auth.status === 'guest';
  const profileKey = username?.trim() || 'me';

  const profileQuery = useQuery({
    queryKey: ['profile', profileKey],
    queryFn: () => (username ? getPublicProfile(username) : getMyProfile()),
    enabled: isPublic || isOwnApi,
  });

  const updateProfile = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: async (profile) => {
      queryClient.setQueryData(['profile', 'me'], profile);
      await auth.refresh();
    },
  });

  const apiPlayer = profileQuery.data
    ? {
        name: profileQuery.data.displayName,
        avatarId: profileQuery.data.avatarId,
        username: profileQuery.data.username,
      }
    : null;
  const player = apiPlayer ?? { name: localPlayer.name, avatarId: localPlayer.avatarId, username: undefined };
  const ratings = profileQuery.data ? mapProfileRatings(profileQuery.data.ratings) : localRatings;
  const history: RatingHistoryEntry[] = profileQuery.data ? mapProfileHistory(profileQuery.data.history) : localHistory;
  const canEdit = isOwnApi || isGuestLocal;
  const [name, setName] = useState(player.name);
  const [confirmReset, setConfirmReset] = useState(false);
  const featured = featuredGameRating(ratings);
  const featuredRank = getRankByRating(featured.rating);

  useEffect(() => {
    setName(player.name);
  }, [player.name]);

  function saveDisplayName() {
    const next = name.trim().slice(0, 40);
    if (!next || next === player.name) return;
    if (isOwnApi) {
      updateProfile.mutate({ displayName: next, avatarId: player.avatarId });
      return;
    }
    updateLocalPlayer({ name: next });
  }

  function saveAvatar(avatarId: string) {
    if (isOwnApi) {
      updateProfile.mutate({ displayName: player.name, avatarId });
      return;
    }
    updateLocalPlayer({ avatarId });
  }

  if (auth.status === 'unknown' && !isPublic) {
    return <p className="text-sm text-stone-500">Đang tải hồ sơ…</p>;
  }

  if ((isPublic || isOwnApi) && profileQuery.isLoading) {
    return <p className="text-sm text-stone-500">Đang tải hồ sơ…</p>;
  }

  if ((isPublic || isOwnApi) && profileQuery.isError) {
    const missing = profileQuery.error instanceof ApiError && profileQuery.error.status === 404;
    return (
      <EmptyState
        title={missing ? 'Không tìm thấy kỳ thủ' : 'Không tải được hồ sơ'}
        message={missing ? `Không có tài khoản ${username}.` : 'Máy chủ hồ sơ chưa trả lời. Thử lại sau.'}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Hồ sơ</p>
          <h1 className="mt-1 font-display text-4xl">Kỳ thủ</h1>
          <p className="mt-2 max-w-xl text-sm text-stone-500">
            {isPublic
              ? `Hồ sơ công khai của ${player.username ?? username}. Elo lấy từ máy chủ.`
              : isOwnApi
                ? `Elo online của ${player.username}, lưu trên máy chủ.`
                : `Điểm Elo nội bộ của Cheslax, lưu trên thiết bị này. Mùa ${seasonId}. Đăng nhập để dùng hồ sơ online.`}
          </p>
        </div>
        <Link to="/leaderboard" className="text-sm font-medium text-brand hover:underline">
          Bảng xếp hạng
        </Link>
      </div>

      {isGuestLocal ? (
        <p className="rounded-2xl bg-brand/10 px-4 py-3 text-sm text-brand">
          Đây là Elo trên thiết bị.{' '}
          <Link to="/login" className="font-medium underline">
            Đăng nhập
          </Link>{' '}
          để xem và sửa hồ sơ trên API.
        </p>
      ) : null}

      <section className="rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <PlayerAvatar avatarId={player.avatarId} name={player.name} size="lg" />
          <div className="min-w-0 flex-1">
            <RankBadge rank={featuredRank} size="lg" showName showLevel />
            <p className="mt-2 text-sm text-stone-500">
              {player.username ? `@${player.username}` : 'Cấp nổi bật theo game có Elo cao hơn.'}
            </p>
          </div>
        </div>
        {canEdit ? (
          <>
            <label className="mt-5 block text-sm font-medium">
              Tên hiển thị
              <input
                value={name}
                maxLength={40}
                onChange={(event) => setName(event.target.value)}
                onBlur={saveDisplayName}
                disabled={updateProfile.isPending}
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none ring-brand focus:ring-2 dark:border-stone-600 dark:bg-stone-800"
              />
            </label>
            <p className="mt-4 text-sm font-medium">Huy hiệu đại diện</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AVATAR_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => saveAvatar(id)}
                  className={player.avatarId === id ? 'rounded-full ring-2 ring-brand' : 'rounded-full'}
                  aria-label={`Chọn avatar ${id}`}
                >
                  <PlayerAvatar avatarId={id} name={player.name} size="sm" />
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-5 text-lg font-medium">{player.name}</p>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <GameBlock title="Cờ vua" rating={ratings.chess} />
        <GameBlock title="Ô ăn quan" rating={ratings['o-an-quan']} />
      </div>

      <section>
        <h2 className="font-display text-2xl">Lịch sử thay đổi điểm</h2>
        {history.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Chưa có ván xếp hạng"
              message={
                isGuestLocal
                  ? 'Thắng hoặc thua một ván cờ vua đấu với máy để ghi Elo. Ván hai người trên cùng thiết bị không tính điểm.'
                  : 'Các ván online đã xếp hạng sẽ xuất hiện tại đây.'
              }
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-stone-200 overflow-hidden rounded-3xl bg-white ring-1 ring-stone-200 dark:divide-stone-700 dark:bg-stone-900 dark:ring-stone-700">
            {history.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-3">
                  <RankBadge rank={entry.newRankId} size="sm" />
                  <div>
                    <p className="font-medium">
                      {entry.gameId === 'chess' ? 'Cờ vua' : 'Ô ăn quan'} · {resultText(entry.result)} {entry.opponentName}
                    </p>
                    <p className="text-sm text-stone-500">
                      {formatRating(entry.oldRating)} → {formatRating(entry.newRating)}
                    </p>
                  </div>
                </div>
                <span className={entry.delta >= 0 ? 'font-mono text-teal-600' : 'font-mono text-rose-600'}>
                  {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isGuestLocal ? (
        <>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setConfirmReset(true)}>
              Reset điểm xếp hạng
            </Button>
          </div>
          <ConfirmDialog
            open={confirmReset}
            title="Reset điểm xếp hạng?"
            message="Elo, thống kê xếp hạng và lịch sử điểm trên thiết bị này sẽ trở về 1.000. Tên hiển thị được giữ."
            confirmLabel="Reset"
            onConfirm={() => {
              resetLocalRatings();
              setConfirmReset(false);
            }}
            onCancel={() => setConfirmReset(false)}
          />
        </>
      ) : null}
    </div>
  );
}

function GameBlock({ title, rating }: { title: string; rating: PlayerGameRating }) {
  const rank = getRankByRating(rating.rating);
  return (
    <article className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl">{title}</h2>
        <RankBadge rank={rank} size="sm" showName />
      </div>
      <RankProgress rating={rating.rating} />
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Mini label="Thắng" value={rating.wins} />
        <Mini label="Thua" value={rating.losses} />
        <Mini label="Hòa" value={rating.draws} />
        <Mini label="Tổng ván xếp hạng" value={rating.gamesPlayed} />
        <Mini label="Tỷ lệ thắng" value={`${winRate(rating).toFixed(0)}%`} />
        <Mini label="Elo cao nhất" value={formatRating(rating.highestRating)} />
      </dl>
    </article>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-3 dark:bg-stone-800">
      <dt className="text-stone-500">{label}</dt>
      <dd className="mt-1 font-display text-2xl">{value}</dd>
    </div>
  );
}

function resultText(result: EloResult): string {
  if (result === 'win') return 'Thắng';
  if (result === 'loss') return 'Thua';
  return 'Hòa';
}
