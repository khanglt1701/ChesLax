import { type FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlayerAvatar } from '@/components/ranking/PlayerAvatar';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { t } from '@/i18n/t';
import { SUPER_ADMIN_ROLE } from '@/services/authService';
import {
  getAdminUser,
  lockAdminUser,
  resetAdminRatings,
  unlockAdminUser,
  updateAdminUser,
} from '@/services/adminService';
import { ApiError } from '@/services/apiClient';
import { formatWhen, gameLabel } from './adminFormat';

type ConfirmAction = 'lock' | 'unlock' | 'reset' | null;

export function AdminUserDetailPage() {
  const { userId = '' } = useParams();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState('');
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [message, setMessage] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => getAdminUser(userId),
    enabled: Boolean(userId),
  });
  const user = query.data;

  useEffect(() => {
    if (user) setDisplayName(user.displayName);
  }, [user]);

  const saveName = useMutation({
    mutationFn: () => updateAdminUser(userId, displayName.trim()),
    onSuccess: (next) => {
      queryClient.setQueryData(['admin', 'user', userId], next);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setMessage(t('admin.saved'));
    },
    onError: (error) => {
      setMessage(error instanceof ApiError ? error.message : t('admin.actionError'));
    },
  });

  const action = useMutation({
    mutationFn: async (next: Exclude<ConfirmAction, null>) => {
      if (next === 'lock') return lockAdminUser(userId);
      if (next === 'unlock') return unlockAdminUser(userId);
      return resetAdminRatings(userId);
    },
    onSuccess: (next) => {
      queryClient.setQueryData(['admin', 'user', userId], next);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
      setConfirm(null);
      setMessage(t('admin.saved'));
    },
    onError: (error) => {
      setConfirm(null);
      setMessage(error instanceof ApiError ? error.message : t('admin.actionError'));
    },
  });

  if (query.isError) {
    return <EmptyState title={t('admin.loadError')} message={t('admin.loadErrorHint')} />;
  }

  if (!user) {
    return <p className="text-sm text-stone-500">{t('admin.checking')}</p>;
  }

  const systemAccount = user.isBot || user.roles.includes(SUPER_ADMIN_ROLE);
  const canLock = !systemAccount && !user.isLocked;
  const canUnlock = user.isLocked;

  function onSave(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    saveName.mutate();
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/users" className="text-sm font-medium text-brand hover:underline">
        {t('admin.backUsers')}
      </Link>

      <section className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        <PlayerAvatar avatarId={user.avatarId} name={user.displayName} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-3xl">{user.displayName}</h2>
          <p className="text-sm text-stone-500">
            @{user.username} · {user.email}
          </p>
          <p className="mt-1 text-xs text-stone-400">
            {t('admin.colCreated')}: {formatWhen(user.createdAt)} · {t('admin.lastSeen')}: {formatWhen(user.lastSeenAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.isLocked ? (
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
              {t('admin.locked')}
            </span>
          ) : (
            <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">{t('admin.active')}</span>
          )}
          {user.roles.map((role) => (
            <span key={role} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium dark:bg-stone-800">
              {role}
            </span>
          ))}
        </div>
      </section>

      {message ? (
        <p className="rounded-xl bg-brand/10 px-4 py-2 text-sm text-stone-700 dark:text-stone-200">{message}</p>
      ) : null}

      <form
        onSubmit={onSave}
        className="space-y-3 rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700"
      >
        <h3 className="font-display text-2xl">{t('admin.editUser')}</h3>
        <label className="block text-sm font-medium">
          {t('auth.displayName')}
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            disabled={user.isBot}
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none ring-brand focus:ring-2 disabled:opacity-60 dark:border-stone-600 dark:bg-stone-950"
          />
        </label>
        <Button type="submit" disabled={user.isBot || saveName.isPending || displayName.trim().length === 0}>
          {t('admin.save')}
        </Button>
      </form>

      <section className="space-y-3 rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        <h3 className="font-display text-2xl">{t('admin.ratings')}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {user.ratings.map((rating) => (
            <div key={rating.gameId} className="rounded-2xl bg-stone-50 p-4 dark:bg-stone-800/60">
              <p className="text-sm font-medium">{gameLabel(rating.gameId)}</p>
              <p className="mt-1 font-display text-3xl tabular-nums">{rating.rating}</p>
              <p className="mt-1 text-xs text-stone-500">
                {rating.wins}W / {rating.losses}L / {rating.draws}D · {rating.gamesPlayed} {t('admin.gamesPlayed')}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        {canLock ? (
          <Button variant="danger" onClick={() => setConfirm('lock')}>
            {t('admin.lock')}
          </Button>
        ) : null}
        {canUnlock ? (
          <Button variant="secondary" onClick={() => setConfirm('unlock')}>
            {t('admin.unlock')}
          </Button>
        ) : null}
        {!user.isBot ? (
          <Button variant="secondary" onClick={() => setConfirm('reset')}>
            {t('admin.resetRatings')}
          </Button>
        ) : null}
        <Link
          to={`/profile/${encodeURIComponent(user.username)}`}
          className="inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-medium ring-1 ring-stone-300 dark:bg-stone-800 dark:ring-stone-600"
        >
          {t('admin.publicProfile')}
        </Link>
      </section>

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm === 'lock'
            ? t('admin.lockTitle')
            : confirm === 'unlock'
              ? t('admin.unlockTitle')
              : t('admin.resetTitle')
        }
        message={
          confirm === 'lock'
            ? t('admin.lockBody')
            : confirm === 'unlock'
              ? t('admin.unlockBody')
              : t('admin.resetBody')
        }
        confirmLabel={t('admin.confirm')}
        cancelLabel={t('admin.cancel')}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) action.mutate(confirm);
        }}
      />
    </div>
  );
}
