import { resolveBoardSize, valueMark, type CaroMark } from './caroEngine';
import { cn } from '@/utils/cn';

const MIN_CELL_PX = 24;
const MAX_CELL_PX = 48;

interface CaroBoardProps {
  cells: number[];
  size?: number;
  turn: CaroMark;
  lastIndex: number | null;
  winningLine: number[];
  disabled?: boolean;
  onPlace: (index: number) => void;
}

export function CaroBoard({ cells, size, turn, lastIndex, winningLine, disabled = false, onPlace }: CaroBoardProps) {
  const boardSize = resolveBoardSize(cells, size);
  const winners = new Set(winningLine);
  return (
    <div className="w-full overflow-x-auto overscroll-x-contain">
      <div
        className="mx-auto grid aspect-square shrink-0 gap-px rounded-2xl bg-[#c4a574] p-1 shadow-inner"
        style={{
          width: `min(100%, ${boardSize * MAX_CELL_PX}px)`,
          minWidth: `${boardSize * MIN_CELL_PX}px`,
          gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`,
        }}
        role="grid"
        aria-label={`Bàn cờ caro ${boardSize}x${boardSize}`}
      >
        {cells.map((cell, index) => {
          const mark = valueMark(cell);
          const winning = winners.has(index);
          const latest = index === lastIndex;
          return (
            <button
              key={index}
              type="button"
              role="gridcell"
              aria-label={labelFor(index, boardSize, mark)}
              disabled={disabled || mark !== null}
              onClick={() => onPlace(index)}
              className={cn(
                'group relative flex h-full w-full touch-manipulation items-center justify-center bg-[#f4e2bf] text-[clamp(0.75rem,2.4vw,1.2rem)] font-semibold leading-none select-none',
                'enabled:hover:bg-[#ffe7b8] disabled:cursor-default',
                winning && 'bg-emerald-200',
                latest && !winning && 'bg-[#ffe0a3]',
              )}
            >
              {mark === 'x' ? <span className="text-rose-700">X</span> : null}
              {mark === 'o' ? <span className="text-sky-800">O</span> : null}
              {mark === null && !disabled ? (
                <span
                  className={cn(
                    'pointer-events-none opacity-0 group-hover:opacity-40 group-focus-visible:opacity-40',
                    turn === 'x' ? 'text-rose-700' : 'text-sky-800',
                  )}
                >
                  {turn === 'x' ? 'X' : 'O'}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function labelFor(index: number, size: number, mark: CaroMark | null): string {
  const row = Math.floor(index / size) + 1;
  const column = (index % size) + 1;
  if (mark === 'x') return `Hàng ${row} cột ${column}, quân X`;
  if (mark === 'o') return `Hàng ${row} cột ${column}, quân O`;
  return `Hàng ${row} cột ${column}, ô trống`;
}
