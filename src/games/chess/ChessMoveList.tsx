import { cn } from '@/utils/cn';

interface ChessMoveListProps {
  moves: string[];
  ply?: number;
  framed?: boolean;
  onPlyChange?: (ply: number) => void;
}

export function ChessMoveList({ moves, ply = moves.length, framed = true, onPlyChange }: ChessMoveListProps) {
  const rows = Math.ceil(moves.length / 2);

  return (
    <section className={cn(framed && 'cheslax-panel rounded-2xl p-4')}>
      {framed ? <h3 className="text-sm font-semibold">Lịch sử nước đi</h3> : null}
      {moves.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500 dark:text-[#cbbda8]">Chưa có nước đi nào.</p>
      ) : (
        <ol className="mt-3 max-h-52 space-y-1 overflow-y-auto font-mono text-sm">
          {Array.from({ length: rows }, (_, index) => {
            const white = moves[index * 2];
            const black = moves[index * 2 + 1];
            const whitePly = index * 2 + 1;
            const blackPly = index * 2 + 2;
            return (
              <li
                key={index}
                className="grid grid-cols-[2rem_1fr_1fr] gap-2 rounded-lg px-1 py-0.5 even:bg-black/5 dark:even:bg-white/5"
              >
                <span className="text-stone-400 dark:text-[#a89884]">{index + 1}.</span>
                <MoveCell
                  san={white}
                  active={ply === whitePly}
                  onClick={onPlyChange ? () => onPlyChange(whitePly) : undefined}
                />
                <MoveCell
                  san={black ?? ''}
                  active={Boolean(black) && ply === blackPly}
                  onClick={onPlyChange && black ? () => onPlyChange(blackPly) : undefined}
                />
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function MoveCell({
  san,
  active,
  onClick,
}: {
  san: string;
  active: boolean;
  onClick?: () => void;
}) {
  if (!san) return <span />;
  if (!onClick) return <span className={cn(active && 'font-semibold text-brand')}>{san}</span>;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md px-1 text-left hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand',
        active && 'bg-brand/15 font-semibold text-brand',
      )}
    >
      {san}
    </button>
  );
}
