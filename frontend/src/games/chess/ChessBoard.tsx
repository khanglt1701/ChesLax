import type { Square } from 'chess.js';
import { cn } from '@/utils/cn';
import type { ChessSquare } from './chess.types';
import type { BoardThemeId, PieceSetId } from './chessAppearance';
import { ChessPiece } from './ChessPiece';

interface ChessBoardProps {
  board: ChessSquare[][];
  flipped?: boolean;
  selected: Square | null;
  legalTargets: Square[];
  lastMove: { from: Square; to: Square } | null;
  checkedKing: Square | null;
  disabled?: boolean;
  expanded?: boolean;
  boardTheme?: BoardThemeId;
  pieceSet?: PieceSetId;
  onSquareClick: (square: Square) => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export function ChessBoard({
  board,
  flipped = false,
  selected,
  legalTargets,
  lastMove,
  checkedKing,
  disabled,
  expanded,
  boardTheme = 'wood',
  pieceSet = 'fantasy',
  onSquareClick,
}: ChessBoardProps) {
  const rows = flipped ? [...board].reverse().map((row) => [...row].reverse()) : board;

  return (
    <div className={cn('chess-board-shell', `theme-${boardTheme}`, expanded && 'chess-board-shell-expanded')}>
      <div className="chess-board-frame">
        <div className="chess-rank-labels" aria-hidden>
          {(flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]).map((rank) => (
            <span key={rank}>{rank}</span>
          ))}
        </div>
        <div className="chess-board-grid">
          {rows.flat().map((cell) => {
            const isDark = isDarkSquare(cell.square);
            const isSelected = selected === cell.square;
            const isLegal = legalTargets.includes(cell.square);
            const isLast = lastMove?.from === cell.square || lastMove?.to === cell.square;
            const isCheck = checkedKing === cell.square;
            return (
              <button
                key={cell.square}
                type="button"
                disabled={disabled}
                aria-label={squareLabel(cell)}
                onClick={() => onSquareClick(cell.square)}
                className={cn(
                  'chess-square group',
                  isDark ? 'sq-dark' : 'sq-light',
                  isSelected && 'is-selected',
                  isLegal && 'is-legal',
                  isLast && 'is-last',
                  isCheck && 'is-check',
                )}
              >
                {cell.piece ? (
                  <ChessPiece
                    type={cell.piece.type}
                    color={cell.piece.color}
                    set={pieceSet}
                    moving={lastMove?.to === cell.square}
                  />
                ) : isLegal ? (
                  <span className="legal-dot" />
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="chess-file-labels" aria-hidden>
          {(flipped ? [...FILES].reverse() : FILES).map((file) => (
            <span key={file}>{file}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function isDarkSquare(square: Square): boolean {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  return (file + rank) % 2 === 0;
}

function squareLabel(cell: ChessSquare): string {
  if (!cell.piece) return `Ô ${cell.square} trống`;
  const color = cell.piece.color === 'w' ? 'trắng' : 'đen';
  return `Ô ${cell.square}, ${color} ${cell.piece.type}`;
}
