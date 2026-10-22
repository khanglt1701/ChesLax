import type { PieceSymbol, Square } from 'chess.js';
import { FILES, RANKS } from './chessService';
import { ChessPiece } from './ChessPiece';
import type { ChessSquare } from './chess.types';
import { cn } from '@/utils/cn';

interface ChessBoardProps {
  board: ChessSquare[][];
  flipped: boolean;
  selected: Square | null;
  legalTargets: Square[];
  lastMove: { from: Square; to: Square } | null;
  checkedKing: Square | null;
  disabled?: boolean;
  expanded?: boolean;
  onSquareClick: (square: Square) => void;
}

export function ChessBoard({
  board,
  flipped,
  selected,
  legalTargets,
  lastMove,
  checkedKing,
  disabled,
  expanded = false,
  onSquareClick,
}: ChessBoardProps) {
  const ranks = flipped ? [...RANKS].reverse() : RANKS;
  const files = flipped ? [...FILES].reverse() : FILES;
  const squaresByName = new Map(board.flat().map((square) => [square.square, square]));

  return (
    <div className={cn('mx-auto w-full', expanded ? 'max-w-[min(100%,min(78dvh,760px))]' : 'max-w-[min(100%,580px)]')}>
      <div className="rounded-[1.6rem] bg-gradient-to-br from-[#c9956a] via-[#8b5a32] to-[#6f4424] p-2 shadow-lg sm:p-3">
        <div
          className="grid aspect-square w-full overflow-hidden rounded-[1.15rem] shadow-inner"
          style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}
        >
          {ranks.flatMap((rank, rankIndex) =>
            files.map((file, fileIndex) => {
              const square = `${file}${rank}` as Square;
              const cell = squaresByName.get(square);
              const dark = (fileIndex + rankIndex) % 2 === 1;
              const isSelected = selected === square;
              const isLegal = legalTargets.includes(square);
              const isLast = lastMove?.from === square || lastMove?.to === square;
              const isCheck = checkedKing === square;
              const showFile = rank === (flipped ? '8' : '1');
              const showRank = file === (flipped ? 'h' : 'a');

              return (
                <button
                  key={square}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSquareClick(square)}
                  aria-label={`Ô ${square}${cell?.piece ? `, ${cell.piece.color === 'w' ? 'trắng' : 'đen'} ${pieceName(cell.piece.type)}` : ''}`}
                  className={cn(
                    'relative flex items-center justify-center transition-colors',
                    dark ? 'bg-[#5c8a78]' : 'bg-[#f4e6c8]',
                    isLast && 'after:absolute after:inset-0 after:bg-amber-300/40',
                    isSelected && 'ring-2 ring-inset ring-white/90',
                    isCheck && 'bg-rose-400/85',
                    disabled ? 'cursor-default' : 'cursor-pointer hover:brightness-105',
                  )}
                >
                  {cell?.piece ? (
                    <span className="relative z-[1] flex h-full w-full items-center justify-center transition-transform hover:scale-105">
                      <ChessPiece type={cell.piece.type} color={cell.piece.color} />
                    </span>
                  ) : null}
                  {isLegal ? (
                    <span
                      className={cn(
                        'absolute z-[1] rounded-full',
                        cell?.piece
                          ? 'inset-1.5 border-[3px] border-stone-900/30'
                          : 'h-3 w-3 bg-stone-900/30 sm:h-3.5 sm:w-3.5',
                      )}
                    />
                  ) : null}
                  {showFile ? (
                    <span className="absolute bottom-0.5 right-1 z-[1] text-[10px] font-semibold text-stone-800/65">
                      {file}
                    </span>
                  ) : null}
                  {showRank ? (
                    <span className="absolute left-1 top-0.5 z-[1] text-[10px] font-semibold text-stone-800/65">
                      {rank}
                    </span>
                  ) : null}
                </button>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}

function pieceName(type: PieceSymbol): string {
  const names: Record<PieceSymbol, string> = {
    p: 'tốt',
    n: 'mã',
    b: 'tượng',
    r: 'xe',
    q: 'hậu',
    k: 'vua',
  };
  return names[type];
}
