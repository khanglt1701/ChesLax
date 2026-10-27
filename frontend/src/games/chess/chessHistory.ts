import type { PieceSymbol, Square } from 'chess.js';

export interface ChessPly {
  fen: string;
  san: string;
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
}

export interface ChessLine<TExtra> {
  startFen: string;
  plies: ChessPly[];
  extras: TExtra[];
  cursor: number;
}

export function createChessLine<TExtra>(startFen: string): ChessLine<TExtra> {
  return { startFen, plies: [], extras: [], cursor: 0 };
}

export function currentFen<TExtra>(line: ChessLine<TExtra>): string {
  if (line.cursor <= 0) return line.startFen;
  return line.plies[line.cursor - 1]?.fen ?? line.startFen;
}

export function visibleSans<TExtra>(line: ChessLine<TExtra>): string[] {
  return line.plies.slice(0, line.cursor).map((ply) => ply.san);
}

export function lastMoveOf<TExtra>(line: ChessLine<TExtra>): { from: Square; to: Square } | null {
  if (line.cursor <= 0) return null;
  const ply = line.plies[line.cursor - 1];
  return ply ? { from: ply.from, to: ply.to } : null;
}

export function canUndo<TExtra>(line: ChessLine<TExtra>): boolean {
  return line.cursor > 0;
}

export function canRedo<TExtra>(line: ChessLine<TExtra>): boolean {
  return line.cursor < line.plies.length;
}

export function extraAt<TExtra>(line: ChessLine<TExtra>): TExtra | undefined {
  if (line.cursor <= 0) return undefined;
  return line.extras[line.cursor - 1];
}

export function pushPly<TExtra>(line: ChessLine<TExtra>, ply: ChessPly, extra: TExtra): ChessLine<TExtra> {
  return {
    startFen: line.startFen,
    plies: [...line.plies.slice(0, line.cursor), ply],
    extras: [...line.extras.slice(0, line.cursor), extra],
    cursor: line.cursor + 1,
  };
}

export function undoLine<TExtra>(line: ChessLine<TExtra>): ChessLine<TExtra> {
  if (line.cursor <= 0) return line;
  return { ...line, cursor: line.cursor - 1 };
}

export function redoLine<TExtra>(line: ChessLine<TExtra>): ChessLine<TExtra> {
  if (line.cursor >= line.plies.length) return line;
  return { ...line, cursor: line.cursor + 1 };
}

export function turnFromFen(fen: string): 'w' | 'b' {
  return fen.split(' ')[1] === 'b' ? 'b' : 'w';
}

/** Undo one ply, or keep undoing until `untilTurn` is to move. */
export function undoMoves<TExtra>(line: ChessLine<TExtra>, untilTurn?: 'w' | 'b'): ChessLine<TExtra> {
  if (!canUndo(line)) return line;
  let next = undoLine(line);
  if (!untilTurn) return next;
  while (canUndo(next) && turnFromFen(currentFen(next)) !== untilTurn) {
    next = undoLine(next);
  }
  return next;
}

/** Redo one ply, or keep redoing until `untilTurn` is to move (or the line ends). */
export function redoMoves<TExtra>(line: ChessLine<TExtra>, untilTurn?: 'w' | 'b'): ChessLine<TExtra> {
  if (!canRedo(line)) return line;
  let next = redoLine(line);
  if (!untilTurn) return next;
  while (canRedo(next) && turnFromFen(currentFen(next)) !== untilTurn) {
    next = redoLine(next);
  }
  return next;
}
