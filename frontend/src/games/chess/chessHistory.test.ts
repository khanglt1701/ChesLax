import { describe, expect, it } from 'vitest';
import {
  canRedo,
  canUndo,
  createChessLine,
  currentFen,
  lastMoveOf,
  pushPly,
  redoLine,
  redoMoves,
  undoLine,
  undoMoves,
  visibleSans,
  type ChessLine,
} from './chessHistory';
import { applyMove, getSnapshotFromFen, startingFen } from './chessService';

function play(line: ChessLine<number>, from: string, to: string, extra: number, promotion?: 'q' | 'r' | 'b' | 'n') {
  const result = applyMove(currentFen(line), from as never, to as never, promotion);
  return pushPly(
    line,
    {
      fen: result.fen,
      san: result.san,
      from: result.from,
      to: result.to,
      promotion: result.promotion,
    },
    extra,
  );
}

describe('chess undo/redo history', () => {
  it('disables undo at the initial position', () => {
    const line = createChessLine<number>(startingFen());
    expect(canUndo(line)).toBe(false);
    expect(currentFen(line)).toBe(startingFen());
  });

  it('disables redo when no future moves exist', () => {
    let line = createChessLine<number>(startingFen());
    expect(canRedo(line)).toBe(false);
    line = play(line, 'e2', 'e4', 1);
    expect(canRedo(line)).toBe(false);
    expect(canUndo(line)).toBe(true);
  });

  it('restores the board position and side to move', () => {
    let line = createChessLine<number>(startingFen());
    line = play(line, 'e2', 'e4', 1);
    line = play(line, 'e7', 'e5', 2);
    expect(getSnapshotFromFen(currentFen(line)).turn).toBe('w');
    expect(visibleSans(line)).toEqual(['e4', 'e5']);

    line = undoLine(line);
    expect(getSnapshotFromFen(currentFen(line)).turn).toBe('b');
    expect(visibleSans(line)).toEqual(['e4']);
    expect(lastMoveOf(line)).toEqual({ from: 'e2', to: 'e4' });

    line = redoLine(line);
    expect(getSnapshotFromFen(currentFen(line)).turn).toBe('w');
    expect(visibleSans(line)).toEqual(['e4', 'e5']);
    expect(lastMoveOf(line)).toEqual({ from: 'e7', to: 'e5' });
  });

  it('undoes back to a chosen side to move, then redoes that pair', () => {
    let line = createChessLine<number>(startingFen());
    line = play(line, 'e2', 'e4', 1);
    line = play(line, 'e7', 'e5', 2);
    line = undoMoves(line, 'w');
    expect(visibleSans(line)).toEqual([]);
    expect(getSnapshotFromFen(currentFen(line)).turn).toBe('w');
    expect(canRedo(line)).toBe(true);

    line = redoMoves(line, 'w');
    expect(visibleSans(line)).toEqual(['e4', 'e5']);
    expect(getSnapshotFromFen(currentFen(line)).turn).toBe('w');
    expect(canRedo(line)).toBe(false);
  });

  it('clears abandoned future history after a new move', () => {
    let line = createChessLine<number>(startingFen());
    line = play(line, 'e2', 'e4', 1);
    line = play(line, 'e7', 'e5', 2);
    line = undoLine(line);
    line = undoLine(line);
    expect(canRedo(line)).toBe(true);

    line = play(line, 'd2', 'd4', 3);
    expect(canRedo(line)).toBe(false);
    expect(visibleSans(line)).toEqual(['d4']);
    expect(line.plies).toHaveLength(1);
  });

  it('keeps castling, en passant, and promotion correct after undo and redo', () => {
    let castle = createChessLine<number>('4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1');
    castle = play(castle, 'e1', 'g1', 1);
    expect(visibleSans(castle)[0]).toBe('O-O');
    const castleFen = currentFen(castle);
    expect(getSnapshotFromFen(castleFen).board.flat().find((cell) => cell.square === 'g1')?.piece?.type).toBe('k');
    expect(getSnapshotFromFen(castleFen).board.flat().find((cell) => cell.square === 'f1')?.piece?.type).toBe('r');
    castle = undoLine(castle);
    expect(getSnapshotFromFen(currentFen(castle)).board.flat().find((cell) => cell.square === 'e1')?.piece?.type).toBe('k');
    expect(getSnapshotFromFen(currentFen(castle)).board.flat().find((cell) => cell.square === 'h1')?.piece?.type).toBe('r');
    castle = redoLine(castle);
    expect(currentFen(castle)).toBe(castleFen);

    let passant = createChessLine<number>('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3');
    passant = play(passant, 'e5', 'd6', 1);
    expect(visibleSans(passant)[0]).toBe('exd6');
    const passantFen = currentFen(passant);
    expect(getSnapshotFromFen(passantFen).board.flat().find((cell) => cell.square === 'd5')?.piece).toBeNull();
    expect(getSnapshotFromFen(passantFen).board.flat().find((cell) => cell.square === 'd6')?.piece?.type).toBe('p');
    passant = undoLine(passant);
    expect(getSnapshotFromFen(currentFen(passant)).board.flat().find((cell) => cell.square === 'd5')?.piece?.type).toBe('p');
    passant = redoLine(passant);
    expect(currentFen(passant)).toBe(passantFen);

    let promo = createChessLine<number>('8/4P3/8/8/8/8/8/4K2k w - - 0 1');
    promo = play(promo, 'e7', 'e8', 1, 'q');
    expect(visibleSans(promo)[0]).toContain('=Q');
    const promoFen = currentFen(promo);
    expect(getSnapshotFromFen(promoFen).board.flat().find((cell) => cell.square === 'e8')?.piece).toEqual({
      type: 'q',
      color: 'w',
    });
    promo = undoLine(promo);
    expect(getSnapshotFromFen(currentFen(promo)).board.flat().find((cell) => cell.square === 'e7')?.piece?.type).toBe('p');
    promo = redoLine(promo);
    expect(currentFen(promo)).toBe(promoFen);
  });
});
