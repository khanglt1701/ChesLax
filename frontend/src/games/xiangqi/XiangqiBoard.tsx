import { useMemo } from 'react';
import { CheckFlash } from '@/games/CheckFlash';
import { cn } from '@/utils/cn';
import {
  XIANGQI_FILES,
  XIANGQI_RANKS,
  isRedPiece,
  pieceGlyph,
  pieceName,
  type XiangqiState,
} from './xiangqi.types';
import { inCheck, kingSquare, pieceAt, squareName } from './xiangqiEngine';

interface XiangqiBoardProps {
  state: XiangqiState;
  selected: string | null;
  legal: string[];
  flipped?: boolean;
  disabled?: boolean;
  checkPulse?: number;
  onSelect: (square: string) => void;
}

const CELL = 28;
const PAD = 22;
const WIDTH = PAD * 2 + CELL * (XIANGQI_FILES - 1);
const HEIGHT = PAD * 2 + CELL * (XIANGQI_RANKS - 1);

export function XiangqiBoard({
  state,
  selected,
  legal,
  flipped = false,
  disabled,
  checkPulse = 0,
  onSelect,
}: XiangqiBoardProps) {
  const checkSquare = useMemo(() => (inCheck(state) ? kingSquare(state, state.turn) : null), [state]);

  const points = useMemo(() => {
    const items: Array<{ square: string; file: number; rank: number; x: number; y: number }> = [];
    for (let rank = 0; rank < XIANGQI_RANKS; rank += 1) {
      for (let file = 0; file < XIANGQI_FILES; file += 1) {
        const square = squareName(file, rank);
        items.push({ square, file, rank, ...xy(file, rank, flipped) });
      }
    }
    return items;
  }, [flipped]);

  return (
    <div className="xiangqi-board-frame">
      <div className="xiangqi-board" data-testid="xiangqi-board">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="xiangqi-grid" aria-hidden="true">
          <rect x="0" y="0" width={WIDTH} height={HEIGHT} className="xiangqi-wood" />
          {Array.from({ length: XIANGQI_RANKS }, (_, rank) => {
            const y = PAD + (XIANGQI_RANKS - 1 - rank) * CELL;
            return (
              <line
                key={`h-${rank}`}
                x1={PAD}
                y1={y}
                x2={PAD + CELL * (XIANGQI_FILES - 1)}
                y2={y}
                className="xiangqi-line"
              />
            );
          })}
          {Array.from({ length: XIANGQI_FILES }, (_, file) => {
            const x = PAD + file * CELL;
            return (
              <g key={`v-${file}`}>
                <line x1={x} y1={PAD} x2={x} y2={PAD + CELL * 4} className="xiangqi-line" />
                <line x1={x} y1={PAD + CELL * 5} x2={x} y2={PAD + CELL * 9} className="xiangqi-line" />
                {file === 0 || file === XIANGQI_FILES - 1 ? (
                  <line x1={x} y1={PAD + CELL * 4} x2={x} y2={PAD + CELL * 5} className="xiangqi-line" />
                ) : null}
              </g>
            );
          })}
          <Palace file={3} rank={0} flipped={flipped} />
          <Palace file={3} rank={7} flipped={flipped} />
          <text x={PAD + CELL * (flipped ? 6 : 2)} y={PAD + CELL * 4.62} className="xiangqi-river-text">
            楚 河
          </text>
          <text x={PAD + CELL * (flipped ? 2 : 6)} y={PAD + CELL * 4.62} className="xiangqi-river-text">
            漢 界
          </text>
        </svg>
        {points.map((point) => {
          const piece = pieceAt(state.squares, point.square);
          const isLegal = legal.includes(point.square);
          const isCapture = Boolean(piece) && isLegal;
          const isLast = point.square === state.lastFrom || point.square === state.lastTo;
          const checked = point.square === checkSquare;
          return (
            <button
              key={point.square}
              type="button"
              disabled={disabled}
              aria-label={squareLabel(point.square, piece)}
              data-square={point.square}
              onClick={() => onSelect(point.square)}
              className={cn(
                'xiangqi-point',
                selected === point.square && 'is-selected',
                isLegal && 'is-legal',
                isCapture && 'is-capture',
                isLast && 'is-last',
                checked && 'is-check',
                piece && isRedPiece(piece) && 'is-red',
                piece && !isRedPiece(piece) && 'is-black',
              )}
              style={{ left: `${(point.x / WIDTH) * 100}%`, top: `${(point.y / HEIGHT) * 100}%` }}
            >
              {piece ? (
                <span className="xiangqi-piece" title={pieceName(piece)}>
                  {pieceGlyph(piece)}
                </span>
              ) : isLegal ? (
                <span className="xiangqi-dot" />
              ) : null}
            </button>
          );
        })}
        {checkPulse > 0 ? <CheckFlash pulse={checkPulse} /> : null}
      </div>
    </div>
  );
}

function Palace({ file, rank, flipped }: { file: number; rank: number; flipped: boolean }) {
  const a = xy(file, rank, flipped);
  const b = xy(file + 2, rank + 2, flipped);
  const c = xy(file + 2, rank, flipped);
  const d = xy(file, rank + 2, flipped);
  return (
    <g>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="xiangqi-line" />
      <line x1={c.x} y1={c.y} x2={d.x} y2={d.y} className="xiangqi-line" />
    </g>
  );
}

function xy(file: number, rank: number, flipped: boolean): { x: number; y: number } {
  const drawFile = flipped ? XIANGQI_FILES - 1 - file : file;
  const drawRank = flipped ? rank : XIANGQI_RANKS - 1 - rank;
  return { x: PAD + drawFile * CELL, y: PAD + drawRank * CELL };
}

function squareLabel(square: string, piece: string): string {
  if (!piece) return `Giao điểm ${square}`;
  return `${pieceName(piece)} ${isRedPiece(piece) ? 'đỏ' : 'đen'} ${square}`;
}

