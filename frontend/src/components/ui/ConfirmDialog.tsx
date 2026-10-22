import { Button } from './Button';
import { cn } from '@/utils/cn';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  contained?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  contained = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className={cn(
        'inset-0 z-50 flex items-center justify-center bg-black/40 p-4',
        contained ? 'absolute' : 'fixed',
      )}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-2xl bg-paper p-6 shadow-xl dark:bg-stone-900"
      >
        <h2 id="confirm-title" className="font-display text-2xl text-ink dark:text-paper">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
