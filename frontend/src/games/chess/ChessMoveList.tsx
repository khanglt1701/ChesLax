import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface ChessMoveListProps {
  moves: string[];
  ply?: number;
  onPlyChange?: (ply: number) => void;
}

export function ChessMoveList({ moves, ply = moves.length, onPlyChange }: ChessMoveListProps) {
  const rows = Math.ceil(moves.length / 2);
  const livePly = moves.length;
  const canNav = Boolean(onPlyChange) && livePly > 0;

  return (
    <section className="rounded-2xl bg-white/80 p-4 ring-1 ring-stone-200 dark:bg-stone-900/70 dark:ring-stone-700">
      <h3 className="text-sm font-semibold">Lịch sử nước đi</h3>
      {moves.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">Chưa có nước đi nào.</p>
      ) : (
        <>
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
                  <span className="text-stone-400">{index + 1}.</span>
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
          {canNav ? (
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              <Button
                variant="secondary"
                className="px-2 py-1.5 text-xs"
                disabled={ply <= 0}
                onClick={() => onPlyChange?.(0)}
              >
                Đầu
              </Button>
              <Button
                variant="secondary"
                className="px-2 py-1.5 text-xs"
                disabled={ply <= 0}
                onClick={() => onPlyChange?.(Math.max(0, ply - 1))}
              >
                Trước
              </Button>
              <Button
                variant="secondary"
                className="px-2 py-1.5 text-xs"
                disabled={ply >= livePly}
                onClick={() => onPlyChange?.(Math.min(livePly, ply + 1))}
              >
                Tiếp
              </Button>
              <Button
                variant="secondary"
                className="px-2 py-1.5 text-xs"
                disabled={ply >= livePly}
                onClick={() => onPlyChange?.(livePly)}
              >
                Cuối
              </Button>
            </div>
          ) : null}
        </>
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
        'rounded-md px-1 text-left hover:bg-brand/10',
        active && 'bg-brand/15 font-semibold text-brand',
      )}
    >
      {san}
    </button>
  );
}
