import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { chooseAiMove, evaluateFen } from './chessAi';
import { applyMove, getAllLegalMoves, startingFen } from './chessService';

const stableRng = () => 0.5;

describe('chessAi', () => {
  it('evaluates a queen advantage as winning for white', () => {
    const equal = evaluateFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    const extraQueen = evaluateFen('4k3/8/8/8/8/8/8/4K2Q w - - 0 1');
    expect(extraQueen).toBeGreaterThan(equal + 800);
  });

  it('returns a legal move from the starting position at every level', () => {
    const fen = startingFen();
    const legal = new Set(getAllLegalMoves(fen).map((move) => `${move.from}${move.to}${move.promotion ?? ''}`));
    for (const level of ['easy', 'medium', 'hard'] as const) {
      const move = chooseAiMove(fen, level, stableRng);
      expect(move).toBeTruthy();
      expect(legal.has(`${move?.from}${move?.to}${move?.promotion ?? ''}`)).toBe(true);
    }
  });

  it('takes mate in one at every level when there is no noise', () => {
    const fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4';
    for (const level of ['easy', 'medium', 'hard'] as const) {
      const move = chooseAiMove(fen, level, stableRng);
      expect(move?.san).toBe('Qxf7#');
    }
  });

  it('prefers capturing a hanging queen over a quiet rook move', () => {
    const fen = '4k3/8/8/q7/8/8/8/R3K3 w - - 0 1';
    const move = chooseAiMove(fen, 'hard', stableRng);
    expect(move?.from).toBe('a1');
    expect(move?.to).toBe('a5');
  });

  it('returns null when the game is already over', () => {
    const fen = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
    expect(chooseAiMove(fen, 'hard', stableRng)).toBeNull();
  });

  it('plays a book opening for medium and hard from the start', () => {
    const first = chooseAiMove(startingFen(), 'hard', () => 0);
    expect(first).toBeTruthy();
    expect(['e4', 'd4', 'Nf3', 'c4']).toContain(first?.san);
  });

  it('keeps the position legal after an AI reply to e4', () => {
    const afterE4 = applyMove(startingFen(), 'e2', 'e4').fen;
    const reply = chooseAiMove(afterE4, 'medium', stableRng);
    expect(reply).toBeTruthy();
    expect(() => new Chess(reply?.fen)).not.toThrow();
    expect(new Chess(reply!.fen).turn()).toBe('w');
  });
});
