import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/ui/EmptyState';
import { t } from '@/i18n/t';
import { getAdminMatches } from '@/services/adminService';
import { formatWhen, gameLabel, modeLabel, outcomeLabel, statusLabel } from './adminFormat';
import { AdminFilterChip, AdminPager } from './AdminPager';

const GAMES = [
  { id: '', key: 'admin.kindAll' },
  { id: 'chess', key: 'admin.chess' },
  { id: 'caro', key: 'admin.caro' },
  { id: 'o-an-quan', key: 'admin.oAnQuan' },
] as const;

const STATUSES = [
  { id: '', key: 'admin.kindAll' },
  { id: 'playing', key: 'admin.statusPlaying' },
  { id: 'finished', key: 'admin.statusFinished' },
  { id: 'abandoned', key: 'admin.statusAbandoned' },
] as const;

export function AdminMatchesPage() {
  const [params, setParams] = useSearchParams();
  const game = params.get('game') ?? '';
  const status = params.get('status') ?? '';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const list = useQuery({
    queryKey: ['admin', 'matches', game, status, page],
    queryFn: () => getAdminMatches({ game: game || undefined, status: status || undefined, page }),
  });

  function patch(next: Record<string, string | null>) {
    const nextParams = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    }
    nextParams.delete('page');
    setParams(nextParams);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {GAMES.map((item) => (
          <AdminFilterChip key={`g-${item.id}`} active={game === item.id} onClick={() => patch({ game: item.id || null })}>
            {t(item.key)}
          </AdminFilterChip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((item) => (
          <AdminFilterChip
            key={`s-${item.id}`}
            active={status === item.id}
            onClick={() => patch({ status: item.id || null })}
          >
            {t(item.key)}
          </AdminFilterChip>
        ))}
      </div>

      {list.isError ? (
        <EmptyState title={t('admin.loadError')} message={t('admin.loadErrorHint')} />
      ) : !list.data || list.data.items.length === 0 ? (
        <EmptyState title={t('admin.noMatches')} message={t('admin.noMatchesHint')} />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-stone-400">
              <tr>
                <th className="px-5 py-3 font-medium">{t('admin.colTime')}</th>
                <th className="px-5 py-3 font-medium">{t('admin.colRoom')}</th>
                <th className="px-5 py-3 font-medium">{t('admin.colGame')}</th>
                <th className="px-5 py-3 font-medium">{t('admin.colPlayers')}</th>
                <th className="px-5 py-3 font-medium">{t('admin.colStatus')}</th>
                <th className="px-5 py-3 font-medium">{t('admin.colResult')}</th>
              </tr>
            </thead>
            <tbody>
              {list.data.items.map((match) => (
                <tr key={match.id} className="border-t border-stone-100 dark:border-stone-800">
                  <td className="px-5 py-3 whitespace-nowrap text-stone-500">{formatWhen(match.createdAt)}</td>
                  <td className="px-5 py-3 font-mono">{match.roomCode}</td>
                  <td className="px-5 py-3">
                    {gameLabel(match.gameId)} · {modeLabel(match.mode)}
                    {match.rated ? ` · ${t('admin.rated')}` : ''}
                  </td>
                  <td className="px-5 py-3">
                    {match.player1Username} vs {match.player2Username}
                  </td>
                  <td className="px-5 py-3">{statusLabel(match.status)}</td>
                  <td className="px-5 py-3">{outcomeLabel(match.outcome, match.opponentType)}</td>
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
