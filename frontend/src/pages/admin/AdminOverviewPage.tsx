import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/ui/EmptyState';
import { t } from '@/i18n/t';
import { getAdminOverview } from '@/services/adminService';
import { formatWhen, gameLabel, modeLabel, statusLabel } from './adminFormat';

export function AdminOverviewPage() {
  const query = useQuery({ queryKey: ['admin', 'overview'], queryFn: getAdminOverview });
  const data = query.data;

  if (query.isError) {
    return <EmptyState title={t('admin.loadError')} message={t('admin.loadErrorHint')} />;
  }

  const cards = data
    ? [
        { label: t('admin.statRegistered'), value: data.registeredUsers, to: '/admin/users' },
        { label: t('admin.statGuests'), value: data.guestUsers, to: '/admin/users?kind=guest' },
        { label: t('admin.statLocked'), value: data.lockedUsers, to: '/admin/users?kind=locked' },
        { label: t('admin.statMatches'), value: data.totalMatches, to: '/admin/matches' },
        { label: t('admin.statMatchesToday'), value: data.matchesToday, to: '/admin/matches' },
        { label: t('admin.statPlaying'), value: data.playingRooms, to: '/admin/rooms?status=playing' },
        { label: t('admin.statWaiting'), value: data.waitingRooms, to: '/admin/rooms?status=waiting' },
        { label: t('admin.statQueue'), value: data.queuedTickets, to: '/admin/rooms' },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data
          ? cards.map((card) => (
              <Link
                key={card.label}
                to={card.to}
                className="rounded-3xl bg-white p-5 ring-1 ring-stone-200 transition hover:ring-brand dark:bg-stone-900 dark:ring-stone-700"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{card.label}</p>
                <p className="mt-2 font-display text-3xl tabular-nums">{card.value}</p>
              </Link>
            ))
          : Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-3xl bg-stone-100 dark:bg-stone-800" />
            ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl">{t('admin.recentMatches')}</h2>
          <Link to="/admin/matches" className="text-sm font-medium text-brand hover:underline">
            {t('admin.viewAll')}
          </Link>
        </div>
        {!data || data.recentMatches.length === 0 ? (
          <EmptyState title={t('admin.noMatches')} message={t('admin.noMatchesHint')} />
        ) : (
          <div className="overflow-x-auto rounded-3xl bg-white ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="px-5 py-3 font-medium">{t('admin.colTime')}</th>
                  <th className="px-5 py-3 font-medium">{t('admin.colGame')}</th>
                  <th className="px-5 py-3 font-medium">{t('admin.colPlayers')}</th>
                  <th className="px-5 py-3 font-medium">{t('admin.colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {data.recentMatches.map((match) => (
                  <tr key={match.id} className="border-t border-stone-100 dark:border-stone-800">
                    <td className="px-5 py-3 whitespace-nowrap text-stone-500">{formatWhen(match.createdAt)}</td>
                    <td className="px-5 py-3">
                      {gameLabel(match.gameId)} · {modeLabel(match.mode)}
                    </td>
                    <td className="px-5 py-3">
                      {match.player1Username} vs {match.player2Username}
                    </td>
                    <td className="px-5 py-3">{statusLabel(match.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
