import { cn } from '@/utils/cn';
import { LEFT_QUAN_INDEX, RIGHT_QUAN_INDEX, type Pit, type PlayerId } from './oAnQuan.types';

interface OAnQuanBoardProps {
  pits: Pit[];
  currentPlayer: PlayerId;
  selectedPit: number | null;
  validPits: number[];
  highlight: { pit: number; kind: string } | null;
  disabled?: boolean;
  playerNames?: [string, string];
  sowHint?: boolean;
  onSelectPit: (index: number) => void;
  onChooseDirection?: (screenDirection: 'left' | 'right') => void;
}

export function OAnQuanBoard({
  pits,
  currentPlayer,
  selectedPit,
  validPits,
  highlight,
  disabled,
  playerNames = ['Người chơi 1', 'Người chơi 2'],
  sowHint = true,
  onSelectPit,
  onChooseDirection,
}: OAnQuanBoardProps) {
  const top = [10, 9, 8, 7, 6].map((index) => pits[index]);
  const bottom = [0, 1, 2, 3, 4].map((index) => pits[index]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className={cn('mb-2 text-center text-sm font-medium', currentPlayer === 1 ? 'text-brand' : 'text-stone-500')}>
        {playerNames[1]}
      </p>
      <div className="oaq-table">
        <div
          className="grid gap-2 sm:gap-3"
          style={{
            gridTemplateColumns: 'minmax(3.1rem,1.2fr) repeat(5,minmax(0,1fr)) minmax(3.1rem,1.2fr)',
            gridTemplateRows: 'auto auto',
          }}
        >
          <PitButton
            pit={pits[LEFT_QUAN_INDEX]}
            label="Ô quan trái"
            selected={false}
            valid={false}
            highlight={highlight}
            className="oaq-bowl-quan row-span-2 min-h-[9.5rem] sm:min-h-[12.5rem]"
            onSelect={onSelectPit}
            disabled
          />
          {top.map((pit) => (
            <PitButton
              key={pit.index}
              pit={pit}
              label={`Ô dân trên ${11 - pit.index}`}
              selected={selectedPit === pit.index}
              valid={validPits.includes(pit.index)}
              highlight={highlight}
              disabled={disabled || !validPits.includes(pit.index)}
              onSelect={onSelectPit}
            />
          ))}
          <PitButton
            pit={pits[RIGHT_QUAN_INDEX]}
            label="Ô quan phải"
            selected={false}
            valid={false}
            highlight={highlight}
            className="oaq-bowl-quan row-span-2 min-h-[9.5rem] sm:min-h-[12.5rem]"
            onSelect={onSelectPit}
            disabled
          />
          {bottom.map((pit) => (
            <PitButton
              key={pit.index}
              pit={pit}
              label={`Ô dân dưới ${pit.index + 1}`}
              selected={selectedPit === pit.index}
              valid={validPits.includes(pit.index)}
              highlight={highlight}
              disabled={disabled || !validPits.includes(pit.index)}
              onSelect={onSelectPit}
            />
          ))}
        </div>
        {sowHint && selectedPit !== null && onChooseDirection ? (
          <div className="mt-3 flex justify-center gap-2">
            <button
              type="button"
              className="rounded-full bg-[#f4e0c0] px-3 py-1.5 text-xs font-semibold text-stone-800 shadow"
              onClick={() => onChooseDirection('left')}
            >
              ← Rải trái
            </button>
            <button
              type="button"
              className="rounded-full bg-[#f4e0c0] px-3 py-1.5 text-xs font-semibold text-stone-800 shadow"
              onClick={() => onChooseDirection('right')}
            >
              Rải phải →
            </button>
          </div>
        ) : null}
      </div>
      <p className={cn('mt-2 text-center text-sm font-medium', currentPlayer === 0 ? 'text-brand' : 'text-stone-500')}>
        {playerNames[0]}
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

function PitButton({ pit, label, selected, valid, highlight, disabled, className, onSelect }: PitButtonProps) {
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
        'oaq-bowl',
        isQuan && 'oaq-bowl-quan',
        valid && 'is-valid',
        selected && 'is-selected',
        isHighlight && kind === 'capture' && 'is-capture',
        isHighlight && kind !== 'capture' && 'is-highlight',
        className,
      )}
    >
      <span className="sr-only">{label}</span>
      <TokenCluster dan={pit.dan} quan={pit.quan} compact={!isQuan} />
      <span className="pointer-events-none absolute right-1.5 bottom-1 rounded bg-black/25 px-1.5 text-[11px] font-semibold tabular-nums text-amber-50">
        {pit.dan + pit.quan}
      </span>
    </button>
  );
}

function TokenCluster({ dan, quan, compact }: { dan: number; quan: number; compact: boolean }) {
  const shownDan = Math.min(dan, compact ? 8 : 12);
  const extra = dan - shownDan;
  return (
    <div className="oaq-stones">
      {quan > 0
        ? Array.from({ length: quan }, (_, index) => <QuanStone key={`q-${index}`} />)
        : null}
      {Array.from({ length: shownDan }, (_, index) => (
        <DanStone key={`d-${index}`} />
      ))}
      {extra > 0 ? <span className="text-[10px] font-semibold text-amber-100">+{extra}</span> : null}
    </div>
  );
}

function DanStone() {
  return <span className="oaq-dan" title="Quân dân" />;
}

function QuanStone() {
  return <span className="oaq-quan" title="Quân quan" />;
}
