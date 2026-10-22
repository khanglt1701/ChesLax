import { Button } from './Button';
import { cn } from '@/utils/cn';

interface GameResultModalProps {
  open: boolean;
  title: string;
  message: string;
  contained?: boolean;
  onPlayAgain: () => void;
  onClose: () => void;
}

export function GameResultModal({
  open,
  title,
  message,
  contained = false,
  onPlayAgain,
  onClose,
}: GameResultModalProps) {
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
        aria-labelledby="result-title"
        className="w-full max-w-md rounded-2xl bg-paper p-6 text-center shadow-xl dark:bg-stone-900"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Kết quả</p>
        <h2 id="result-title" className="mt-2 font-display text-3xl text-ink dark:text-paper">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          <Button onClick={onPlayAgain}>Chơi lại</Button>
        </div>
      </div>
    </div>
  );
}
