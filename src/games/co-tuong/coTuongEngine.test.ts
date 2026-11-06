import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  inCheck,
  isCheckmate,
  isStalemate,
  legalMovesFrom,
  parseFen,
  toFen,
  tryMove,
} from './coTuongEngine';
import { STARTING_FEN } from './coTuong.types';

describe('coTuong engine', () => {
  it('sets up the standard starting position with red to move', () => {
    const state = createInitialState();
    expect(toFen(state)).toBe(STARTING_FEN);
    expect(state.turn).toBe('r');
    expect(legalMovesFrom(state, 'a3').map((move) => move.to)).toEqual(['a4']);
    expect(legalMovesFrom(state, 'a9')).toEqual([]);
  });

  it('blocks a horse that has an occupied leg', () => {
    const open = createInitialState('4k4/9/9/9/4P4/9/9/9/1N7/4K4 r');
    expect(legalMovesFrom(open, 'b1').map((move) => move.to).sort()).toEqual(['a3', 'c3', 'd0', 'd2']);
    const blocked = createInitialState('4k4/9/9/9/4P4/9/9/1P7/1N7/4K4 r');
    expect(legalMovesFrom(blocked, 'b1').map((move) => move.to).sort()).toEqual(['d0', 'd2']);
  });

  it('stops an elephant at a blocked eye and at the river', () => {
    const state = createInitialState();
    expect(legalMovesFrom(state, 'c0').map((move) => move.to).sort()).toEqual(['a2', 'e2']);
    const blocked = createInitialState('4k4/9/9/9/4P4/9/9/9/3P5/2B1K4 r');
    expect(legalMovesFrom(blocked, 'c0').map((move) => move.to)).not.toContain('e2');
  });

  it('keeps advisors and generals inside the palace', () => {
    const state = createInitialState();
    expect(legalMovesFrom(state, 'd0').map((move) => move.to)).toEqual(['e1']);
    expect(legalMovesFrom(state, 'e0').map((move) => move.to)).toEqual(['e1']);
  });

  it('lets a cannon capture with exactly one screen', () => {
    const state = createInitialState('4k4/9/4n4/4p4/9/4C4/9/9/9/4K4 r');
    expect(legalMovesFrom(state, 'e4').map((move) => move.to)).toContain('e7');
    expect(tryMove(state, 'e4', 'e9')).toBeNull();
  });

  it('lets a soldier move sideways only after crossing the river', () => {
    const before = createInitialState('4k4/9/9/9/9/9/4P4/9/9/4K4 r');
    expect(legalMovesFrom(before, 'e3').map((move) => move.to)).toEqual(['e4']);
    const after = createInitialState('3k5/9/9/9/4P4/9/9/9/9/4K4 r');
    expect(legalMovesFrom(after, 'e5').map((move) => move.to).sort()).toEqual(['d5', 'e6', 'f5']);
  });

  it('forbids exposing the flying general', () => {
    const state = createInitialState('4k4/9/9/9/4P4/9/9/9/9/4K4 r');
    expect(tryMove(state, 'e5', 'd5')).toBeNull();
  });

  it('detects check and checkmate', () => {
    const check = tryMove(createInitialState('4k4/9/9/9/9/9/9/9/4R4/4K4 r'), 'e1', 'e8');
    expect(check).not.toBeNull();
    expect(inCheck(check!.state)).toBe(true);
    const mate = createInitialState('4k2R1/7R1/9/9/4P4/9/9/9/9/4K4 b');
    expect(isCheckmate(mate)).toBe(true);
  });

  it('treats stalemate as no legal moves without check', () => {
    const state = createInitialState('4k4/R8/9/9/4P4/9/9/9/9/3RKR3 b');
    expect(inCheck(state)).toBe(false);
    expect(isStalemate(state)).toBe(true);
  });

  it('rejects out-of-turn moves and capturing the general', () => {
    const state = createInitialState();
    expect(tryMove(state, 'a6', 'a5')).toBeNull();
    const face = createInitialState('4k4/9/9/9/9/9/9/9/4R4/4K4 r');
    expect(tryMove(face, 'e1', 'e9')).toBeNull();
  });

  it('round-trips FEN after a capture', () => {
    const moved = tryMove(createInitialState(), 'h2', 'h9');
    expect(moved).not.toBeNull();
    expect(toFen(parseFen(toFen(moved!.state)))).toBe(toFen(moved!.state));
    expect(moved!.captured).toBe('n');
  });
});
