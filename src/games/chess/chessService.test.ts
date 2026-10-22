import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import {
  applyMove,
  getAllLegalMoves,
  getLegalMoves,
  getSnapshotFromFen,
  needsPromotion,
  startingFen,
} from './chessService';

describe('chessService', () => {
  it('starts from the standard position with 32 pieces', () => {
    const snap = getSnapshotFromFen(startingFen());
    const pieces = snap.board.flat().filter((square) => square.piece);
    expect(pieces).toHaveLength(32);
    expect(snap.turn).toBe('w');
    expect(snap.status).toBe('playing');
    expect(snap.board[0][0].piece).toEqual({ type: 'r', color: 'b' });
    expect(snap.board[7][4].piece).toEqual({ type: 'k', color: 'w' });
  });

  it('allows a legal pawn opening and rejects an illegal leap', () => {
    const fen = startingFen();
    const legal = getLegalMoves(fen, 'e2').map((move) => move.to);
    expect(legal).toEqual(expect.arrayContaining(['e3', 'e4']));
    expect(() => applyMove(fen, 'e2', 'e5')).toThrow();
    const next = applyMove(fen, 'e2', 'e4');
    expect(next.san).toBe('e4');
    expect(getSnapshotFromFen(next.fen).turn).toBe('b');
  });

  it('does not allow a bishop to jump through its own pawns', () => {
    const fen = startingFen();
    expect(getLegalMoves(fen, 'c1')).toHaveLength(0);
  });

  it('detects check and checkmate from fool\'s mate', () => {
    let fen = startingFen();
    fen = applyMove(fen, 'f2', 'f3').fen;
    fen = applyMove(fen, 'e7', 'e5').fen;
    fen = applyMove(fen, 'g2', 'g4').fen;
    const mate = applyMove(fen, 'd8', 'h4');
    const snap = getSnapshotFromFen(mate.fen);
    expect(snap.status).toBe('checkmate');
    expect(snap.isGameOver).toBe(true);
    expect(snap.turn).toBe('w');
  });

  it('detects check that is not mate', () => {
    const chess = new Chess();
    chess.move('e4');
    chess.move('e5');
    chess.move('Qh5');
    chess.move('Nc6');
    chess.move('Qxe5');
    const snap = getSnapshotFromFen(chess.fen());
    expect(snap.status).toBe('check');
    expect(snap.inCheck).toBe(true);
    expect(snap.isGameOver).toBe(false);
  });

  it('supports kingside castling when path and rights are intact', () => {
    const chess = new Chess();
    chess.move('e4');
    chess.move('e5');
    chess.move('Nf3');
    chess.move('Nc6');
    chess.move('Bc4');
    chess.move('Bc5');
    const fen = chess.fen();
    const castle = getLegalMoves(fen, 'e1').find((move) => move.to === 'g1');
    expect(castle).toBeTruthy();
    const next = applyMove(fen, 'e1', 'g1');
    expect(next.san).toBe('O-O');
    const snap = getSnapshotFromFen(next.fen);
    expect(snap.board[7][6].piece).toEqual({ type: 'k', color: 'w' });
    expect(snap.board[7][5].piece).toEqual({ type: 'r', color: 'w' });
  });

  it('rejects castling after the king has moved', () => {
    const chess = new Chess();
    chess.move('e4');
    chess.move('e5');
    chess.move('Nf3');
    chess.move('Nc6');
    chess.move('Bc4');
    chess.move('Bc5');
    chess.move('Ke2');
    chess.move('Nf6');
    chess.move('Ke1');
    chess.move('d6');
    expect(getLegalMoves(chess.fen(), 'e1').some((move) => move.to === 'g1')).toBe(false);
  });

  it('requires a promotion piece when a pawn reaches the last rank', () => {
    const fen = '8/P7/8/8/8/8/8/4K2k w - - 0 1';
    expect(needsPromotion(fen, 'a7', 'a8')).toBe(true);
    const queen = applyMove(fen, 'a7', 'a8', 'q');
    expect(queen.san).toContain('=Q');
    expect(getSnapshotFromFen(queen.fen).board[0][0].piece).toEqual({ type: 'q', color: 'w' });
  });

  it('recognizes insufficient material as a draw', () => {
    const fen = '8/8/8/8/8/8/4K3/4k3 w - - 0 1';
    const snap = getSnapshotFromFen(fen);
    expect(snap.status).toBe('draw-insufficient');
    expect(snap.isGameOver).toBe(true);
  });

  it('recognizes stalemate', () => {
    const fen = '7k/5Q2/8/8/8/8/8/4K3 b - - 0 1';
    const snap = getSnapshotFromFen(fen);
    expect(snap.status).toBe('stalemate');
  });

  it('lists no legal moves after checkmate', () => {
    const fen = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
    expect(getAllLegalMoves(fen)).toHaveLength(0);
    expect(getSnapshotFromFen(fen).status).toBe('checkmate');
  });
});
