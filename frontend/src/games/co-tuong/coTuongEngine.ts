import {
  STARTING_FEN,
  COTUONG_FILES,
  COTUONG_RANKS,
  COTUONG_SQUARES,
  pieceName,
  type CoTuongLegalMove,
  type CoTuongMoveResult,
  type CoTuongSide,
  type CoTuongState,
} from './coTuong.types';

const ORTHO: Array<[number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const HORSE: Array<[number, number, number, number]> = [
  [1, 2, 0, 1],
  [-1, 2, 0, 1],
  [1, -2, 0, -1],
  [-1, -2, 0, -1],
  [2, 1, 1, 0],
  [2, -1, 1, 0],
  [-2, 1, -1, 0],
  [-2, -1, -1, 0],
];
const ELEPHANT: Array<[number, number, number, number]> = [
  [2, 2, 1, 1],
  [2, -2, 1, -1],
  [-2, 2, -1, 1],
  [-2, -2, -1, -1],
];

export function emptySquares(): string {
  return '.'.repeat(COTUONG_SQUARES);
}

export function createInitialState(fen = STARTING_FEN): CoTuongState {
  const parsed = parseFen(fen);
  const keys = [positionKey(parsed.squares, parsed.turn)];
  return { ...parsed, history: [], keys, lastFrom: null, lastTo: null };
}

export function parseFen(fen: string): Pick<CoTuongState, 'squares' | 'turn'> {
  const [board, turnToken] = fen.trim().split(/\s+/);
  const ranks = board?.split('/') ?? [];
  if (ranks.length !== COTUONG_RANKS) throw new Error('CoTuong FEN must contain 10 ranks.');
  const cells = emptySquares().split('');
  ranks.forEach((row, fenRank) => {
    const rank = COTUONG_RANKS - 1 - fenRank;
    let file = 0;
    for (const symbol of row) {
      if (symbol >= '1' && symbol <= '9') {
        file += Number(symbol);
        continue;
      }
      if (file >= COTUONG_FILES) throw new Error('CoTuong FEN rank is too long.');
      cells[indexOf(file, rank)] = symbol;
      file += 1;
    }
    if (file !== COTUONG_FILES) throw new Error('CoTuong FEN rank is the wrong width.');
  });
  return { squares: cells.join(''), turn: turnToken?.startsWith('b') ? 'b' : 'r' };
}

export function toFen(state: Pick<CoTuongState, 'squares' | 'turn'>): string {
  const parts: string[] = [];
  for (let rank = COTUONG_RANKS - 1; rank >= 0; rank -= 1) {
    let empty = 0;
    let row = '';
    for (let file = 0; file < COTUONG_FILES; file += 1) {
      const piece = pieceAtIndex(state.squares, indexOf(file, rank));
      if (!piece) {
        empty += 1;
        continue;
      }
      if (empty > 0) {
        row += String(empty);
        empty = 0;
      }
      row += piece;
    }
    if (empty > 0) row += String(empty);
    parts.push(row);
  }
  return `${parts.join('/')} ${state.turn}`;
}

export function cloneState(state: CoTuongState): CoTuongState {
  return {
    squares: state.squares,
    turn: state.turn,
    history: [...state.history],
    keys: [...state.keys],
    lastFrom: state.lastFrom,
    lastTo: state.lastTo,
  };
}

export function pieceAt(squares: string, square: string): string {
  const index = parseSquare(square);
  return index < 0 ? '' : pieceAtIndex(squares, index);
}

export function pieceAtIndex(squares: string, index: number): string {
  const value = squares[index] ?? '.';
  return value === '.' ? '' : value;
}

export function inCheck(state: CoTuongState, side: CoTuongSide = state.turn): boolean {
  return isKingAttacked(state.squares, side);
}

export function legalMoves(state: CoTuongState): CoTuongLegalMove[] {
  return generateLegalMoves(state);
}

export function legalMovesFrom(state: CoTuongState, from: string): CoTuongLegalMove[] {
  return generateLegalMoves(state).filter((move) => move.from === from);
}

export function tryMove(state: CoTuongState, from: string, to: string): CoTuongMoveResult | null {
  const legal = generateLegalMoves(state).some((move) => move.from === from && move.to === to);
  if (!legal) return null;
  return applyMove(state, from, to);
}

export function isCheckmate(state: CoTuongState): boolean {
  return inCheck(state) && generateLegalMoves(state).length === 0;
}

export function isStalemate(state: CoTuongState): boolean {
  return !inCheck(state) && generateLegalMoves(state).length === 0;
}

export function isThreefold(state: CoTuongState): boolean {
  const key = positionKey(state.squares, state.turn);
  return state.keys.filter((item) => item === key).length >= 3;
}

export function isGameOver(state: CoTuongState): boolean {
  return isCheckmate(state) || isStalemate(state) || isThreefold(state);
}

export function statusOf(state: CoTuongState): 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw-threefold' {
  if (isCheckmate(state)) return 'checkmate';
  if (isStalemate(state)) return 'stalemate';
  if (isThreefold(state)) return 'draw-threefold';
  if (inCheck(state)) return 'check';
  return 'playing';
}

export function resultLabel(state: CoTuongState): string {
  const status = statusOf(state);
  if (status === 'checkmate') return state.turn === 'r' ? 'Đen chiếu hết' : 'Đỏ chiếu hết';
  if (status === 'stalemate') return state.turn === 'r' ? 'Đỏ hết nước đi' : 'Đen hết nước đi';
  if (status === 'draw-threefold') return 'Hòa vì lặp thế cờ';
  if (status === 'check') return state.turn === 'r' ? 'Đỏ đang bị chiếu' : 'Đen đang bị chiếu';
  return state.turn === 'r' ? 'Lượt Đỏ' : 'Lượt Đen';
}

export function otherSide(side: CoTuongSide): CoTuongSide {
  return side === 'r' ? 'b' : 'r';
}

export function sideOf(piece: string): CoTuongSide | null {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? 'r' : 'b';
}

export function squareName(file: number, rank: number): string {
  return `${String.fromCharCode(97 + file)}${rank}`;
}

export function parseSquare(value: string): number {
  if (!value || value.length !== 2) return -1;
  const file = value.charCodeAt(0) - 97;
  const rank = Number(value[1]);
  return onBoard(file, rank) ? indexOf(file, rank) : -1;
}

export function indexOf(file: number, rank: number): number {
  return rank * COTUONG_FILES + file;
}

export function fileOf(index: number): number {
  return index % COTUONG_FILES;
}

export function rankOf(index: number): number {
  return Math.floor(index / COTUONG_FILES);
}

export function onBoard(file: number, rank: number): boolean {
  return file >= 0 && file < COTUONG_FILES && rank >= 0 && rank < COTUONG_RANKS;
}

export function inPalace(file: number, rank: number, side: CoTuongSide): boolean {
  if (file < 3 || file > 5) return false;
  return side === 'r' ? rank >= 0 && rank <= 2 : rank >= 7 && rank <= 9;
}

export function elephantOnHome(rank: number, side: CoTuongSide): boolean {
  return side === 'r' ? rank <= 4 : rank >= 5;
}

export function crossedRiver(rank: number, side: CoTuongSide): boolean {
  return side === 'r' ? rank >= 5 : rank <= 4;
}

export function pieceValue(piece: string): number {
  switch (piece.toLowerCase()) {
    case 'k':
      return 10_000;
    case 'r':
      return 900;
    case 'c':
      return 450;
    case 'n':
      return 400;
    case 'a':
    case 'b':
      return 200;
    case 'p':
      return 100;
    default:
      return 0;
  }
}

function generateLegalMoves(state: CoTuongState): CoTuongLegalMove[] {
  const legal: CoTuongLegalMove[] = [];
  for (const move of generatePseudoMoves(state.squares, state.turn)) {
    const next = putPiece(state.squares, move.from, move.to);
    if (isKingAttacked(next, state.turn)) continue;
    legal.push(move);
  }
  return legal;
}

function generatePseudoMoves(squares: string, side: CoTuongSide): CoTuongLegalMove[] {
  const moves: CoTuongLegalMove[] = [];
  for (let index = 0; index < COTUONG_SQUARES; index += 1) {
    const piece = pieceAtIndex(squares, index);
    if (!piece || sideOf(piece) !== side) continue;
    const from = squareName(fileOf(index), rankOf(index));
    switch (piece.toLowerCase()) {
      case 'k':
        addGeneralMoves(moves, squares, index, from, side);
        break;
      case 'a':
        addAdvisorMoves(moves, squares, index, from, side);
        break;
      case 'b':
        addElephantMoves(moves, squares, index, from, side);
        break;
      case 'n':
        addHorseMoves(moves, squares, index, from, side);
        break;
      case 'r':
        addChariotMoves(moves, squares, index, from, side);
        break;
      case 'c':
        addCannonMoves(moves, squares, index, from, side);
        break;
      case 'p':
        addSoldierMoves(moves, squares, index, from, side);
        break;
      default:
        break;
    }
  }
  return moves;
}

function addGeneralMoves(moves: CoTuongLegalMove[], squares: string, index: number, from: string, side: CoTuongSide) {
  const file = fileOf(index);
  const rank = rankOf(index);
  for (const [df, dr] of ORTHO) {
    const nextFile = file + df;
    const nextRank = rank + dr;
    if (!inPalace(nextFile, nextRank, side)) continue;
    tryAdd(moves, squares, from, indexOf(nextFile, nextRank), side);
  }
}

function addAdvisorMoves(moves: CoTuongLegalMove[], squares: string, index: number, from: string, side: CoTuongSide) {
  const file = fileOf(index);
  const rank = rankOf(index);
  for (const [df, dr] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ] as Array<[number, number]>) {
    const nextFile = file + df;
    const nextRank = rank + dr;
    if (!inPalace(nextFile, nextRank, side)) continue;
    tryAdd(moves, squares, from, indexOf(nextFile, nextRank), side);
  }
}

function addElephantMoves(moves: CoTuongLegalMove[], squares: string, index: number, from: string, side: CoTuongSide) {
  const file = fileOf(index);
  const rank = rankOf(index);
  for (const [df, dr, ef, er] of ELEPHANT) {
    const eyeFile = file + ef;
    const eyeRank = rank + er;
    const nextFile = file + df;
    const nextRank = rank + dr;
    if (!onBoard(eyeFile, eyeRank) || pieceAtIndex(squares, indexOf(eyeFile, eyeRank))) continue;
    if (!onBoard(nextFile, nextRank) || !elephantOnHome(nextRank, side)) continue;
    tryAdd(moves, squares, from, indexOf(nextFile, nextRank), side);
  }
}

function addHorseMoves(moves: CoTuongLegalMove[], squares: string, index: number, from: string, side: CoTuongSide) {
  const file = fileOf(index);
  const rank = rankOf(index);
  for (const [df, dr, bf, br] of HORSE) {
    const blockFile = file + bf;
    const blockRank = rank + br;
    if (!onBoard(blockFile, blockRank) || pieceAtIndex(squares, indexOf(blockFile, blockRank))) continue;
    const nextFile = file + df;
    const nextRank = rank + dr;
    if (!onBoard(nextFile, nextRank)) continue;
    tryAdd(moves, squares, from, indexOf(nextFile, nextRank), side);
  }
}

function addChariotMoves(moves: CoTuongLegalMove[], squares: string, index: number, from: string, side: CoTuongSide) {
  const file = fileOf(index);
  const rank = rankOf(index);
  for (const [df, dr] of ORTHO) {
    let nextFile = file + df;
    let nextRank = rank + dr;
    while (onBoard(nextFile, nextRank)) {
      const dest = indexOf(nextFile, nextRank);
      const occupant = pieceAtIndex(squares, dest);
      if (!occupant) {
        moves.push({ from, to: squareName(nextFile, nextRank) });
      } else {
        tryAdd(moves, squares, from, dest, side);
        break;
      }
      nextFile += df;
      nextRank += dr;
    }
  }
}

function addCannonMoves(moves: CoTuongLegalMove[], squares: string, index: number, from: string, side: CoTuongSide) {
  const file = fileOf(index);
  const rank = rankOf(index);
  for (const [df, dr] of ORTHO) {
    let screens = 0;
    let nextFile = file + df;
    let nextRank = rank + dr;
    while (onBoard(nextFile, nextRank)) {
      const dest = indexOf(nextFile, nextRank);
      const occupant = pieceAtIndex(squares, dest);
      if (!occupant) {
        if (screens === 0) moves.push({ from, to: squareName(nextFile, nextRank) });
      } else {
        screens += 1;
        if (screens === 2) {
          tryAdd(moves, squares, from, dest, side);
          break;
        }
      }
      nextFile += df;
      nextRank += dr;
    }
  }
}

function addSoldierMoves(moves: CoTuongLegalMove[], squares: string, index: number, from: string, side: CoTuongSide) {
  const file = fileOf(index);
  const rank = rankOf(index);
  const forward = side === 'r' ? 1 : -1;
  const nextRank = rank + forward;
  if (onBoard(file, nextRank)) tryAdd(moves, squares, from, indexOf(file, nextRank), side);
  if (!crossedRiver(rank, side)) return;
  if (onBoard(file - 1, rank)) tryAdd(moves, squares, from, indexOf(file - 1, rank), side);
  if (onBoard(file + 1, rank)) tryAdd(moves, squares, from, indexOf(file + 1, rank), side);
}

function tryAdd(moves: CoTuongLegalMove[], squares: string, from: string, to: number, side: CoTuongSide) {
  const occupant = pieceAtIndex(squares, to);
  if (occupant && sideOf(occupant) === side) return;
  if (occupant.toLowerCase() === 'k') return;
  moves.push({ from, to: squareName(fileOf(to), rankOf(to)) });
}

function applyMove(state: CoTuongState, from: string, to: string): CoTuongMoveResult {
  const fromIndex = parseSquare(from);
  const toIndex = parseSquare(to);
  const piece = pieceAtIndex(state.squares, fromIndex);
  const captured = pieceAtIndex(state.squares, toIndex) || null;
  const squares = putPiece(state.squares, from, to);
  const turn = otherSide(state.turn);
  const notation = `${pieceName(piece)} ${from}${captured ? 'x' : '-'}${to}`;
  const next: CoTuongState = {
    squares,
    turn,
    history: [...state.history, notation],
    keys: [...state.keys, positionKey(squares, turn)],
    lastFrom: from,
    lastTo: to,
  };
  return { state: next, notation, from, to, captured };
}

function putPiece(squares: string, from: string, to: string): string {
  const fromIndex = parseSquare(from);
  const toIndex = parseSquare(to);
  const cells = squares.split('');
  cells[toIndex] = cells[fromIndex] ?? '.';
  cells[fromIndex] = '.';
  return cells.join('');
}

function isKingAttacked(squares: string, side: CoTuongSide): boolean {
  const king = findKing(squares, side);
  if (king < 0) return true;
  const targetFile = fileOf(king);
  const targetRank = rankOf(king);
  const bySide = otherSide(side);
  for (let index = 0; index < COTUONG_SQUARES; index += 1) {
    const piece = pieceAtIndex(squares, index);
    if (!piece || sideOf(piece) !== bySide) continue;
    if (attacksSquare(squares, index, piece, targetFile, targetRank, king)) return true;
  }
  return false;
}

function attacksSquare(
  squares: string,
  from: number,
  piece: string,
  targetFile: number,
  targetRank: number,
  target: number,
): boolean {
  const file = fileOf(from);
  const rank = rankOf(from);
  const side = sideOf(piece);
  if (!side) return false;
  switch (piece.toLowerCase()) {
    case 'k':
      if (Math.abs(file - targetFile) + Math.abs(rank - targetRank) === 1 && inPalace(targetFile, targetRank, side)) {
        return true;
      }
      return file === targetFile && screensBetween(squares, from, target) === 0 && pieceAtIndex(squares, target).toLowerCase() === 'k';
    case 'a':
      return Math.abs(file - targetFile) === 1 && Math.abs(rank - targetRank) === 1 && inPalace(targetFile, targetRank, side);
    case 'b':
      if (Math.abs(file - targetFile) !== 2 || Math.abs(rank - targetRank) !== 2) return false;
      if (!elephantOnHome(targetRank, side)) return false;
      return !pieceAtIndex(squares, indexOf((file + targetFile) / 2, (rank + targetRank) / 2));
    case 'n':
      return HORSE.some(([df, dr, bf, br]) => {
        if (file + df !== targetFile || rank + dr !== targetRank) return false;
        return !pieceAtIndex(squares, indexOf(file + bf, rank + br));
      });
    case 'r':
      return (file === targetFile || rank === targetRank) && screensBetween(squares, from, target) === 0;
    case 'c':
      return (file === targetFile || rank === targetRank) && screensBetween(squares, from, target) === 1;
    case 'p': {
      const forward = side === 'r' ? 1 : -1;
      if (file === targetFile && targetRank === rank + forward) return true;
      return crossedRiver(rank, side) && targetRank === rank && Math.abs(targetFile - file) === 1;
    }
    default:
      return false;
  }
}

function screensBetween(squares: string, from: number, to: number): number {
  const file = fileOf(from);
  const rank = rankOf(from);
  const targetFile = fileOf(to);
  const targetRank = rankOf(to);
  const df = Math.sign(targetFile - file);
  const dr = Math.sign(targetRank - rank);
  if (df !== 0 && dr !== 0) return -1;
  let screens = 0;
  let nextFile = file + df;
  let nextRank = rank + dr;
  while (nextFile !== targetFile || nextRank !== targetRank) {
    if (!onBoard(nextFile, nextRank)) return -1;
    if (pieceAtIndex(squares, indexOf(nextFile, nextRank))) screens += 1;
    nextFile += df;
    nextRank += dr;
  }
  return screens;
}

function findKing(squares: string, side: CoTuongSide): number {
  const wanted = side === 'r' ? 'K' : 'k';
  for (let index = 0; index < COTUONG_SQUARES; index += 1) {
    if (pieceAtIndex(squares, index) === wanted) return index;
  }
  return -1;
}

function positionKey(squares: string, turn: CoTuongSide): string {
  return `${squares} ${turn}`;
}

export function kingSquare(state: CoTuongState, side: CoTuongSide): string | null {
  const index = findKing(state.squares, side);
  return index < 0 ? null : squareName(fileOf(index), rankOf(index));
}
