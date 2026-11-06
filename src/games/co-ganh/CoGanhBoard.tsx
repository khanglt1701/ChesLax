import { useMemo } from 'react';
import { cn } from '@/utils/cn';
import { CO_GANH_EDGES, colOf, indexOf, pointName, rowOf } from './coGanhGraph';
import { CO_GANH_SIZE, type CoGanhState } from './coGanh.types';
import { sideLabel, valueSide } from './coGanhEngine';

interface CoGanhBoardProps {
  state: CoGanhState;
  selected: number | null;
  legal: number[];
  flipped?: boolean;
  disabled?: boolean;
  onSelect: (index: number) => void;
}

const CELL = 44;
const PAD = 28;
const SPAN = CELL * (CO_GANH_SIZE - 1);
const SIZE = PAD * 2 + SPAN;

export function CoGanhBoard({ state, selected, legal, flipped = false, disabled, onSelect }: CoGanhBoardProps) {
  const points = useMemo(() => {
    const items: Array<{ index: number; x: number; y: number }> = [];
    for (let row = 0; row < CO_GANH_SIZE; row += 1) {
      for (let col = 0; col < CO_GANH_SIZE; col += 1) {
        const index = indexOf(row, col);
        items.push({ index, ...xy(col, row, flipped) });
      }
    }
    return items;
  }, [flipped]);

  return (
    <div className="coganh-board-frame">
      <div className="coganh-board" data-testid="co-ganh-board">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="coganh-grid" aria-hidden="true">
          <rect x="0" y="0" width={SIZE} height={SIZE} className="coganh-wood" />
          {CO_GANH_EDGES.map(([from, to]) => {
            const a = xy(colOf(from), rowOf(from), flipped);
            const b = xy(colOf(to), rowOf(to), flipped);
            return (
              <line
                key={`${from}-${to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className="coganh-line"
              />
            );
          })}
          {points.map((point) => (
            <circle key={`dot-${point.index}`} cx={point.x} cy={point.y} r="2.2" className="coganh-node" />
          ))}
        </svg>
        {points.map((point) => {
          const value = state.cells[point.index] ?? 0;
          const side = valueSide(value);
          const isLegal = legal.includes(point.index);
          const captured = state.ganh.includes(point.index) || state.vay.includes(point.index);
          const isLast = point.index === state.lastFrom || point.index === state.lastTo;
          return (
            <button
              key={point.index}
              type="button"
              disabled={disabled}
              aria-label={pointLabel(point.index, side)}
              data-point={pointName(point.index)}
              onClick={() => onSelect(point.index)}
              className={cn(
                'coganh-point',
                selected === point.index && 'is-selected',
                isLegal && 'is-legal',
                isLast && 'is-last',
                state.ganh.includes(point.index) && 'is-ganh',
                state.vay.includes(point.index) && 'is-vay',
                side === 'red' && 'is-red',
                side === 'blue' && 'is-blue',
              )}
              style={{ left: `${(point.x / SIZE) * 100}%`, top: `${(point.y / SIZE) * 100}%` }}
            >
              {side ? (
                <span className={cn('coganh-piece', captured && 'is-captured')} title={sideLabel(side)} />
              ) : isLegal ? (
                <span className="coganh-dot" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function xy(col: number, row: number, flipped: boolean): { x: number; y: number } {
  const drawCol = flipped ? CO_GANH_SIZE - 1 - col : col;
  const drawRow = flipped ? CO_GANH_SIZE - 1 - row : row;
  return { x: PAD + drawCol * CELL, y: PAD + drawRow * CELL };
}

function pointLabel(index: number, side: ReturnType<typeof valueSide>): string {
  const name = pointName(index);
  if (!side) return `Giao điểm ${name}`;
  return `Quân ${sideLabel(side)} ${name}`;
}
