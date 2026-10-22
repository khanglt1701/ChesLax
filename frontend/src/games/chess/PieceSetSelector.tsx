import { cn } from '@/utils/cn';
import { PIECE_SETS, type PieceSetId } from './chessAppearance';
import { ChessPiece } from './ChessPiece';

interface PieceSetSelectorProps {
  value: PieceSetId;
  onChange: (set: PieceSetId) => void;
}

export function PieceSetSelector({ value, onChange }: PieceSetSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {PIECE_SETS.map((set) => (
        <button
          key={set.id}
          type="button"
          onClick={() => onChange(set.id)}
          className={cn(
            'rounded-2xl px-3 py-3 text-left ring-1 transition',
            value === set.id
              ? 'ring-2 ring-brand'
              : 'ring-stone-300 hover:bg-stone-50 dark:ring-stone-600 dark:hover:bg-stone-800',
          )}
        >
          <span className="mb-2 flex h-12 items-end justify-center gap-1">
            <span className="h-10 w-10">
              <ChessPiece type="k" color="w" set={set.id} />
            </span>
            <span className="h-10 w-10">
              <ChessPiece type="n" color="b" set={set.id} />
            </span>
          </span>
          <span className="block text-sm font-semibold">{set.label}</span>
          <span className="mt-0.5 block text-xs text-stone-500">{set.description}</span>
        </button>
      ))}
    </div>
  );
}
