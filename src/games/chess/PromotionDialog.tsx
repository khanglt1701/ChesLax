import { ChessPiece } from './ChessPiece';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

const OPTIONS = ['q', 'r', 'b', 'n'] as const;
const LABELS: Record<(typeof OPTIONS)[number], string> = {
  q: 'Hậu',
  r: 'Xe',
  b: 'Tượng',
  n: 'Mã',
};

interface PromotionDialogProps {
  open: boolean;
  color: 'w' | 'b';
  contained?: boolean;
  onSelect: (piece: (typeof OPTIONS)[number]) => void;
  onCancel: () => void;
}

export function PromotionDialog({ open, color, contained = false, onSelect, onCancel }: PromotionDialogProps) {
  if (!open) return null;

  return (
    <div
      className={cn(
        'inset-0 z-50 flex items-center justify-center bg-black/40 p-4',
        contained ? 'absolute' : 'fixed',
      )}
    >
      <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl bg-paper p-6 dark:bg-stone-900">
        <h2 className="font-display text-2xl">Phong cấp tốt</h2>
        <p className="mt-2 text-sm text-stone-500">Chọn quân để thay thế tốt.</p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {OPTIONS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className="flex flex-col items-center rounded-xl bg-white p-2 ring-1 ring-stone-200 hover:ring-brand dark:bg-stone-800 dark:ring-stone-600"
            >
              <ChessPiece type={type} color={color} />
              <span className="mt-1 text-xs">{LABELS[type]}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={onCancel}>
            Hủy
          </Button>
        </div>
      </div>
    </div>
  );
}
