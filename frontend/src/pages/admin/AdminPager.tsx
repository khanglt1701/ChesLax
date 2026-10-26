import { Button } from '@/components/ui/Button';
import { t } from '@/i18n/t';
import { cn } from '@/utils/cn';

export function AdminPager({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        {t('admin.prev')}
      </Button>
      <span className="text-sm text-stone-500">
        {t('admin.page')} {page}/{totalPages}
      </span>
      <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        {t('admin.next')}
      </Button>
    </div>
  );
}

export function AdminFilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-2 text-sm font-medium ring-1 transition',
        active
          ? 'bg-brand text-white ring-brand'
          : 'bg-white text-stone-600 ring-stone-300 hover:bg-stone-50 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-600',
      )}
    >
      {children}
    </button>
  );
}
