import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { t } from '@/i18n/t';
import { closeAdminRoom, getAdminRooms, type AdminRoomRow } from '@/services/adminService';
import { ApiError } from '@/services/apiClient';
import { formatWhen, gameLabel, modeLabel, statusLabel } from './adminFormat';
import { AdminFilterChip, AdminPager } from './AdminPager';

const STATUSES = [
  { id: '', key: 'admin.kindAll' },
  { id: 'waiting', key: 'admin.statusWaiting' },
  { id: 'playing', key: 'admin.statusPlaying' },
  { id: 'finished', key: 'admin.statusFinished' },
  { id: 'abandoned', key: 'admin.statusAbandoned' },
] as const;

export function AdminRoomsPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);
  const [closing, setClosing] = useState<AdminRoomRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['admin', 'rooms', status, page],
    queryFn: () => getAdminRooms({ status: status || undefined, page }),
  });

  const close = useMutation({
    mutationFn: (roomId: string) => closeAdminRoom(roomId),
    onSuccess: () => {
      setClosing(null);
      setMessage(t('admin.roomClosed'));
      void queryClient.invalidateQueries({ queryKey: ['admin', 'rooms'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'matches'] });
    },
    onError: (error) => {
      setClosing(null);
      setMessage(error instanceof ApiError ? error.message : t('admin.actionError'));
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((item) => (
          <AdminFilterChip
            key={item.id}
            active={status === item.id}
            onClick={() => {
              const nextParams = new URLSearchParams(params);
              if (item.id) nextParams.set('status', item.id);
              else nextParams.delete('status');
              nextParams.delete('page');
              setParams(nextParams);
            }}
          >
            {t(item.key)}
          </AdminFilterChip>
        ))}
      </div>

      {message ? (
        <p className="rounded-xl bg-brand/10 px-4 py-2 text-sm text-stone-700 dark:text-stone-200">{message}</p>
      ) : null}

      {list.isError ? (
        <EmptyState title={t('admin.loadError')} message={t('admin.loadErrorHint')} />
      ) : !list.data || list.data.items.length === 0 ? (
        <EmptyState title={t('admin.noRooms')} message={t('admin.noRoomsHint')} />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-stone-400">
              <tr>
                <th className="px-5 py-3 font-medium">{t('admin.colRoom')}</th>
                <th className="px-5 py-3 font-medium">{t('admin.colGame')}</th>
                <th className="px-5 py-3 font-medium">{t('admin.colHost')}</th>
                <th className="px-5 py-3 font-medium">{t('admin.colStatus')}</th>
                <th className="px-5 py-3 font-medium">{t('admin.colActivity')}</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {list.data.items.map((room) => {
                const open = room.status === 'waiting' || room.status === 'playing';
                return (
                  <tr key={room.id} className="border-t border-stone-100 dark:border-stone-800">
                    <td className="px-5 py-3 font-mono">{room.code}</td>
                    <td className="px-5 py-3">
                      {gameLabel(room.gameId)} · {modeLabel(room.mode)} · {room.seatCount}/2
                    </td>
                    <td className="px-5 py-3">{room.hostUsername}</td>
                    <td className="px-5 py-3">{statusLabel(room.status)}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-stone-500">{formatWhen(room.lastActivityAt)}</td>
                    <td className="px-5 py-3 text-right">
                      {open ? (
                        <Button variant="danger" className="px-3 py-1.5" onClick={() => setClosing(room)}>
                          {t('admin.closeRoom')}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
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

      <ConfirmDialog
        open={closing !== null}
        title={t('admin.closeRoomTitle')}
        message={t('admin.closeRoomBody')}
        confirmLabel={t('admin.confirm')}
        cancelLabel={t('admin.cancel')}
        onCancel={() => setClosing(null)}
        onConfirm={() => {
          if (closing) close.mutate(closing.id);
        }}
      />
    </div>
  );
}
