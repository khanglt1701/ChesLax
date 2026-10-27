import { useEffect, useState } from 'react';
import type { Square } from 'chess.js';
import { cn } from '@/utils/cn';
import type { ChessPiece as PieceModel, ChessSquare } from './chess.types';
import type { BoardThemeId, PieceSetId } from './chessAppearance';
import { ChessPiece } from './ChessPiece';
import { castleRookMove, squareGrid } from './chessService';

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

const MOVE_MS = 320;

interface Flight {
  id: string;
  from: Square;
  to: Square;
  piece: PieceModel;
  sliding: boolean;
}

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
  const [flights, setFlights] = useState<Flight[]>([]);
  const hidden = new Set(flights.map((flight) => flight.to));
  const fromSq = lastMove?.from ?? '';
  const toSq = lastMove?.to ?? '';

  useEffect(() => {
    if (!lastMove || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFlights([]);
      return;
    }

    const movers = [lastMove, castleRookMove(lastMove.from, lastMove.to)].filter(
      (move): move is { from: Square; to: Square } => Boolean(move),
    );
    const next: Flight[] = [];
    for (const move of movers) {
      const piece = board.flat().find((cell) => cell.square === move.to)?.piece;
      if (!piece) continue;
      next.push({
        id: `${move.from}${move.to}${piece.color}${piece.type}`,
        from: move.from,
        to: move.to,
        piece,
        sliding: false,
      });
    }
    if (next.length === 0) {
      setFlights([]);
      return;
    }

    setFlights(next);
    const start = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setFlights((current) => current.map((flight) => ({ ...flight, sliding: true })));
      });
    });
    const done = window.setTimeout(() => setFlights([]), MOVE_MS);
    return () => {
      window.cancelAnimationFrame(start);
      window.clearTimeout(done);
    };
  }, [fromSq, toSq, flipped]);

  return (
    <div
      className={cn('chess-board-shell', `theme-${boardTheme}`, expanded && 'chess-board-shell-expanded')}
      data-testid="chess-board"
    >
      <div className="chess-board-frame">
        <div className="chess-board-grid">
          {rows.flat().map((cell) => {
            const isDark = isDarkSquare(cell.square);
            const isSelected = selected === cell.square;
            const isLegal = legalTargets.includes(cell.square);
            const isLast = lastMove?.from === cell.square || lastMove?.to === cell.square;
            const isCheck = checkedKing === cell.square;
            const hidePiece = hidden.has(cell.square);
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
                {cell.piece && !hidePiece ? (
                  <ChessPiece type={cell.piece.type} color={cell.piece.color} set={pieceSet} />
                ) : isLegal ? (
                  <span className="legal-dot" />
                ) : null}
              </button>
            );
          })}
          {flights.length > 0 ? (
            <div className="chess-flight-layer" aria-hidden>
              {flights.map((flight) => {
                const from = squareGrid(flight.from, flipped);
                const to = squareGrid(flight.to, flipped);
                return (
                  <div
                    key={flight.id}
                    className="chess-flight"
                    style={{
                      gridColumn: to.x + 1,
                      gridRow: to.y + 1,
                      transform: flight.sliding
                        ? 'translate3d(0, 0, 0)'
                        : `translate3d(${(from.x - to.x) * 100}%, ${(from.y - to.y) * 100}%, 0)`,
                      transitionDuration: `${MOVE_MS}ms`,
                    }}
                  >
                    <ChessPiece type={flight.piece.type} color={flight.piece.color} set={pieceSet} />
                  </div>
                );
              })}
            </div>
          ) : null}
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
