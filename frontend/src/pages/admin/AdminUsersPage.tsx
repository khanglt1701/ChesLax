import { type FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlayerAvatar } from '@/components/ranking/PlayerAvatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { t } from '@/i18n/t';
import { getAdminUsers, type AdminUserKind } from '@/services/adminService';
import { formatWhen } from './adminFormat';
import { AdminFilterChip, AdminPager } from './AdminPager';

const KINDS: { id: AdminUserKind; key: string }[] = [
  { id: 'registered', key: 'admin.kindRegistered' },
  { id: 'guest', key: 'admin.kindGuest' },
  { id: 'bot', key: 'admin.kindBot' },
  { id: 'locked', key: 'admin.kindLocked' },
  { id: 'all', key: 'admin.kindAll' },
];

export function AdminUsersPage() {
  const [params, setParams] = useSearchParams();
  const kind = (params.get('kind') as AdminUserKind | null) ?? 'registered';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);
  const [draft, setDraft] = useState(params.get('q') ?? '');
  const queryText = params.get('q') ?? '';

  const list = useQuery({
    queryKey: ['admin', 'users', kind, page, queryText],
    queryFn: () => getAdminUsers({ kind, page, q: queryText, pageSize: 20 }),
  });

  function setKind(next: AdminUserKind) {
    const nextParams = new URLSearchParams(params);
    nextParams.set('kind', next);
    nextParams.delete('page');
    setParams(nextParams);
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const nextParams = new URLSearchParams(params);
    if (draft.trim()) nextParams.set('q', draft.trim());
    else nextParams.delete('q');
    nextParams.delete('page');
    setParams(nextParams);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submitSearch} className="flex flex-wrap gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('admin.searchUsers')}
          className="min-w-56 flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none ring-brand focus:ring-2 dark:border-stone-600 dark:bg-stone-950"
        />
        <button type="submit" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">
          {t('admin.search')}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {KINDS.map((item) => (
          <AdminFilterChip key={item.id} active={kind === item.id} onClick={() => setKind(item.id)}>
            {t(item.key)}
          </AdminFilterChip>
        ))}
      </div>

      {list.isError ? (
        <EmptyState title={t('admin.loadError')} message={t('admin.loadErrorHint')} />
      ) : !list.data || list.data.items.length === 0 ? (
        <EmptyState title={t('admin.noUsers')} message={t('admin.noUsersHint')} />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-stone-400">
              <tr>
                <th className="px-5 py-3 font-medium">{t('admin.colUser')}</th>
                <th className="px-5 py-3 font-medium">{t('admin.colEmail')}</th>
                <th className="px-5 py-3 font-medium">{t('admin.colElo')}</th>
                <th className="px-5 py-3 font-medium">{t('admin.colCreated')}</th>
                <th className="px-5 py-3 font-medium">{t('admin.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {list.data.items.map((user) => (
                <tr key={user.id} className="border-t border-stone-100 dark:border-stone-800">
                  <td className="px-5 py-3">
                    <Link to={`/admin/users/${user.id}`} className="flex items-center gap-3 hover:underline">
                      <PlayerAvatar avatarId={user.avatarId} name={user.displayName} size="sm" />
                      <span>
                        <span className="block font-medium">{user.displayName}</span>
                        <span className="block text-xs text-stone-500">@{user.username}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-stone-500">{user.email}</td>
                  <td className="px-5 py-3 font-mono tabular-nums">
                    {user.chessRating}/{user.caroRating}/{user.oAnQuanRating}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-stone-500">{formatWhen(user.createdAt)}</td>
                  <td className="px-5 py-3">
                    {user.isLocked ? (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
                        {t('admin.locked')}
                      </span>
                    ) : user.isBot ? (
                      t('admin.kindBot')
                    ) : user.isGuest ? (
                      t('admin.kindGuest')
                    ) : (
                      t('admin.active')
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {list.data ? (
        <AdminPager
          page={list.data.page}
          totalPages={list.data.totalPages}
          onPage={(next) => {
            const nextParams = new URLSearchParams(params);
            nextParams.set('page', String(next));
            setParams(nextParams);
          }}
        />
      ) : null}
    </div>
  );
}
