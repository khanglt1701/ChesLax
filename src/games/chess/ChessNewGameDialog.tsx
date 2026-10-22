import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { AI_LEVELS } from './chessAi';
import type { ChessAiLevel } from './chess.types';

interface ChessNewGameDialogProps {
  open: boolean;
  versusAi: boolean;
  aiLevel: ChessAiLevel;
  hasProgress: boolean;
  contained?: boolean;
  onCancel: () => void;
  onConfirm: (aiLevel: ChessAiLevel) => void;
}

export function ChessNewGameDialog({ open, ...props }: ChessNewGameDialogProps) {
  if (!open) return null;
  return <ChessNewGameDialogBody {...props} />;
}

function ChessNewGameDialogBody({
  versusAi,
  aiLevel,
  hasProgress,
  contained = false,
  onCancel,
  onConfirm,
}: Omit<ChessNewGameDialogProps, 'open'>) {
  const [draftLevel, setDraftLevel] = useState<ChessAiLevel>(aiLevel);

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
        aria-labelledby="chess-new-game-title"
        className="w-full max-w-md rounded-2xl bg-paper p-6 shadow-xl dark:bg-stone-900"
      >
        <h2 id="chess-new-game-title" className="font-display text-2xl text-ink dark:text-paper">
          Bắt đầu ván mới?
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
          {versusAi
            ? hasProgress
              ? 'Ván đang chơi sẽ bị xóa. Chọn mức máy cho ván mới — mức này giữ nguyên đến hết trận.'
              : 'Chọn mức máy. Không thể đổi độ khó giữa trận.'
            : 'Ván đang chơi sẽ bị xóa. Cài đặt thời gian vẫn được giữ.'}
        </p>

        {versusAi ? (
          <div className="mt-5 grid grid-cols-3 gap-2">
            {AI_LEVELS.map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => setDraftLevel(level.id)}
                className={cn(
                  'rounded-xl px-3 py-2.5 text-sm font-medium ring-1 transition',
                  draftLevel === level.id
                    ? 'bg-brand text-white ring-brand'
                    : 'bg-white text-stone-600 ring-stone-300 hover:bg-stone-50 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-600',
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        ) : null}

        {versusAi ? (
          <p className="mt-3 text-sm leading-6 text-stone-500">
            {AI_LEVELS.find((level) => level.id === draftLevel)?.description}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Hủy
          </Button>
          <Button onClick={() => onConfirm(draftLevel)}>Bắt đầu</Button>
        </div>
      </div>
    </div>
  );
}
