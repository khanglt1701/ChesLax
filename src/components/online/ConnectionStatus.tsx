import { cn } from '@/utils/cn';
import type { ConnectionStatus as Status } from '@/online/onlineGameService';

const LABELS: Record<Status, string> = {
  idle: 'Chưa kết nối',
  connecting: 'Đang kết nối',
  connected: 'Đã kết nối',
  disconnected: 'Mất kết nối',
};

export function ConnectionStatus({ status }: { status: Status }) {
  return (
    <p
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1',
        status === 'connected' && 'bg-teal-50 text-teal-800 ring-teal-200 dark:bg-teal-950/40 dark:text-teal-200',
        status === 'connecting' && 'bg-amber-50 text-amber-800 ring-amber-200',
        (status === 'disconnected' || status === 'idle') && 'bg-rose-50 text-rose-800 ring-rose-200',
      )}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          status === 'connected' && 'bg-teal-500',
          status === 'connecting' && 'animate-pulse bg-amber-500',
          (status === 'disconnected' || status === 'idle') && 'bg-rose-500',
        )}
      />
      {LABELS[status]}
    </p>
  );
}
