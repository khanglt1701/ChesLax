import { cn } from '@/utils/cn';
import { LEFT_QUAN_INDEX, RIGHT_QUAN_INDEX, type Pit, type PlayerId } from './oAnQuan.types';

interface OAnQuanBoardProps {
  pits: Pit[];
  currentPlayer: PlayerId;
  selectedPit: number | null;
  validPits: number[];
  highlight: { pit: number; kind: string } | null;
  disabled?: boolean;
  onSelectPit: (index: number) => void;
}

export function OAnQuanBoard({
  pits,
  currentPlayer,
  selectedPit,
  validPits,
  highlight,
  disabled,
  onSelectPit,
}: OAnQuanBoardProps) {
  const top = [10, 9, 8, 7, 6].map((index) => pits[index]);
  const bottom = [0, 1, 2, 3, 4].map((index) => pits[index]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p
        className={cn(
          'mb-2 text-center text-sm font-medium',
          currentPlayer === 1 ? 'text-brand' : 'text-stone-500',
        )}
      >
        Người chơi 2
      </p>
      <div className="rounded-[2rem] bg-gradient-to-b from-[#c9956a] to-[#8b5a32] p-3 shadow-md sm:p-4">
        <div
          className="grid gap-2 sm:gap-3"
          style={{
            gridTemplateColumns: 'minmax(3rem,1.15fr) repeat(5,minmax(0,1fr)) minmax(3rem,1.15fr)',
            gridTemplateRows: 'auto auto',
          }}
        >
          <PitButton
            pit={pits[LEFT_QUAN_INDEX]}
            label="Quan trái"
            selected={false}
            valid={false}
            highlight={highlight}
            className="row-span-2 min-h-[9rem] sm:min-h-[12rem]"
            onSelect={onSelectPit}
            disabled
          />
          {top.map((pit) => (
            <PitButton
              key={pit.index}
              pit={pit}
              label={`Ô ${11 - pit.index} trên`}
              selected={selectedPit === pit.index}
              valid={validPits.includes(pit.index)}
              highlight={highlight}
              disabled={disabled || !validPits.includes(pit.index)}
              onSelect={onSelectPit}
            />
          ))}
          <PitButton
            pit={pits[RIGHT_QUAN_INDEX]}
            label="Quan phải"
            selected={false}
            valid={false}
            highlight={highlight}
            className="row-span-2 min-h-[9rem] sm:min-h-[12rem]"
            onSelect={onSelectPit}
            disabled
          />
          {bottom.map((pit) => (
            <PitButton
              key={pit.index}
              pit={pit}
              label={`Ô ${pit.index + 1} dưới`}
              selected={selectedPit === pit.index}
              valid={validPits.includes(pit.index)}
              highlight={highlight}
              disabled={disabled || !validPits.includes(pit.index)}
              onSelect={onSelectPit}
            />
          ))}
        </div>
      </div>
      <p
        className={cn(
          'mt-2 text-center text-sm font-medium',
          currentPlayer === 0 ? 'text-brand' : 'text-stone-500',
        )}
      >
        Người chơi 1
      </p>
    </div>
  );
}

interface PitButtonProps {
  pit: Pit;
  label: string;
  selected: boolean;
  valid: boolean;
  highlight: { pit: number; kind: string } | null;
  disabled?: boolean;
  className?: string;
  onSelect: (index: number) => void;
}

function PitButton({
  pit,
  label,
  selected,
  valid,
  highlight,
  disabled,
  className,
  onSelect,
}: PitButtonProps) {
  const isHighlight = highlight?.pit === pit.index;
  const kind = highlight?.kind;
  const isQuan = pit.type === 'quan';

  return (
    <button
      type="button"
      disabled={!isQuan && Boolean(disabled)}
      onClick={() => onSelect(pit.index)}
      aria-label={`${label}, ${pit.dan} dân${pit.quan ? `, ${pit.quan} quan` : ''}`}
      className={cn(
        'relative flex min-h-[4.5rem] flex-col items-center justify-center rounded-[1.6rem] bg-[#f0d5ae] p-2 text-stone-800 ring-2 ring-transparent transition sm:min-h-[5.5rem]',
        isQuan && 'rounded-[2rem] bg-[#e4c08a]',
        valid && !disabled && 'cursor-pointer hover:ring-teal-700/50',
        selected && 'ring-teal-800',
        isHighlight && kind === 'capture' && 'animate-capture bg-amber-300',
        isHighlight && kind !== 'capture' && 'animate-sow ring-orange-700',
        className,
      )}
    >
      <span className="sr-only">{label}</span>
      <TokenCluster dan={pit.dan} quan={pit.quan} />
      <span className="mt-1 text-sm font-semibold tabular-nums">{pit.dan + pit.quan}</span>
      {isQuan ? <span className="text-[10px] uppercase tracking-wide text-stone-600">Quan</span> : null}
    </button>
  );
}

function TokenCluster({ dan, quan }: { dan: number; quan: number }) {
  const shown = Math.min(dan, 10);
  return (
    <div className="flex min-h-8 flex-wrap items-center justify-center gap-1">
      {quan > 0
        ? Array.from({ length: quan }, (_, index) => (
            <span
              key={`q-${index}`}
              className="h-5 w-5 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 ring-2 ring-amber-700"
              title="Quân quan"
            />
          ))
        : null}
      {Array.from({ length: shown }, (_, index) => (
        <span
          key={`d-${index}`}
          className="h-2.5 w-2.5 rounded-full bg-[#f7f1e1] ring-1 ring-[#7a5536]"
          title="Quân dân"
        />
      ))}
    </div>
  );
}
