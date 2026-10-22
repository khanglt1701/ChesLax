import { Chess, type PieceSymbol, type Square } from 'chess.js';
import type { AppliedMove, ChessSnapshot, ChessSquare, ChessStatus, LegalMove } from './chess.types';

export function createChess(fen?: string): Chess {
  return fen ? new Chess(fen) : new Chess();
}

function readStatus(chess: Chess): ChessStatus {
  if (chess.isCheckmate()) return 'checkmate';
  if (chess.isStalemate()) return 'stalemate';
  if (chess.isInsufficientMaterial()) return 'draw-insufficient';
  if (chess.isThreefoldRepetition()) return 'draw-threefold';
  if (chess.isDraw()) {
    if (chess.isGameOver()) return 'draw-fifty';
    return 'draw';
  }
  if (chess.inCheck()) return 'check';
  return 'playing';
}

export function snapshot(chess: Chess): ChessSnapshot {
  const board: ChessSquare[][] = chess.board().map((row, rankIndex) =>
    row.map((piece, fileIndex) => {
      const file = 'abcdefgh'[fileIndex];
      const rank = String(8 - rankIndex);
      return {
        square: `${file}${rank}` as Square,
        piece: piece ? { type: piece.type, color: piece.color } : null,
      };
    }),
  );

  const status = readStatus(chess);
  return {
    fen: chess.fen(),
    turn: chess.turn(),
    status,
    board,
    history: chess.history(),
    inCheck: chess.inCheck(),
    isGameOver: chess.isGameOver(),
  };
}

export function getSnapshotFromFen(fen: string): ChessSnapshot {
  return snapshot(createChess(fen));
}

export function getLegalMoves(fen: string, from: Square): LegalMove[] {
  const chess = createChess(fen);
  return chess
    .moves({ square: from, verbose: true })
    .map((move) => ({
      from: move.from,
      to: move.to,
      san: move.san,
      promotion: move.promotion,
      captured: move.captured,
    }));
}

export function getAllLegalMoves(fen: string): LegalMove[] {
  const chess = createChess(fen);
  return chess.moves({ verbose: true }).map((move) => ({
    from: move.from,
    to: move.to,
    san: move.san,
    promotion: move.promotion,
    captured: move.captured,
  }));
}

export function needsPromotion(fen: string, from: Square, to: Square): boolean {
  const moves = getLegalMoves(fen, from).filter((move) => move.to === to);
  return moves.some((move) => Boolean(move.promotion));
}

export function applyMove(
  fen: string,
  from: Square,
  to: Square,
  promotion?: PieceSymbol,
): AppliedMove {
  const chess = createChess(fen);
  const result = chess.move({ from, to, promotion });
  if (!result) {
    throw new Error('Nước đi không hợp lệ.');
  }
  return {
    fen: chess.fen(),
    san: result.san,
    from: result.from,
    to: result.to,
    promotion: result.promotion,
  };
}

export function undoFen(previousFen: string): ChessSnapshot {
  return getSnapshotFromFen(previousFen);
}

export function startingFen(): string {
  return new Chess().fen();
}

export function statusLabel(status: ChessStatus, turn: 'w' | 'b'): string {
  const side = turn === 'w' ? 'Trắng' : 'Đen';
  switch (status) {
    case 'playing':
      return `Lượt ${side}`;
    case 'check':
      return `${side} đang bị chiếu`;
    case 'checkmate':
      return turn === 'w' ? 'Đen thắng — chiếu hết' : 'Trắng thắng — chiếu hết';
    case 'stalemate':
      return 'Hòa — hết nước đi';
    case 'draw-insufficient':
      return 'Hòa — không đủ quân chiếu hết';
    case 'draw-threefold':
      return 'Hòa — lặp thế cờ 3 lần';
    case 'draw-fifty':
      return 'Hòa — luật 50 nước';
    default:
      return 'Hòa cờ';
  }
}

export function outcomeFromStatus(status: ChessStatus, turn: 'w' | 'b'): 'p1' | 'p2' | 'draw' | null {
  if (status === 'checkmate') return turn === 'w' ? 'p2' : 'p1';
  if (
    status === 'stalemate' ||
    status === 'draw' ||
    status === 'draw-insufficient' ||
    status === 'draw-threefold' ||
    status === 'draw-fifty'
  ) {
    return 'draw';
  }
  return null;
}

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;
