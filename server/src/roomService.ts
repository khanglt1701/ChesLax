import type { PieceSymbol, Square } from 'chess.js';
import { applyMove as applyChessMove, getSnapshotFromFen, startingFen } from '../../frontend/src/games/chess/chessService';
import type { Direction, OAnQuanEvent, OAnQuanState } from '../../frontend/src/games/o-an-quan/oAnQuan.types';
import { applyMoveForPlayer, createInitialState } from '../../frontend/src/games/o-an-quan/oAnQuanEngine';
import { applyRatedGame } from '../../frontend/src/ranking/ratingEngine';
import type { RatingChange } from '../../frontend/src/ranking/ratingTypes';
import {
  DISCONNECT_GRACE_MS,
  LEAVE_GRACE_MS,
  MAX_ROOMS,
  ROOM_IDLE_MS,
  normalizeTimeControlId,
  parseTimeControlBudgetMs,
  type ChessSide,
  type ColorPref,
  type CreateRoomPayload,
  type OnlineGameId,
  type PlayerSide,
  type RoomPublicState,
  type RoomStatus,
  type TimeControlId,
} from '../../frontend/src/online/protocol';
import { generateRoomCode, isPlausibleRoomCode, normalizeRoomCode } from './roomCode';
import type { PlayerRatingsPort } from './ratingRepository';
import { hashToken } from './hash';

export interface PlayerSession {
  playerId: string;
  tokenHash: string;
  name: string;
  avatarId: string;
  socketId: string;
}

interface Seat {
  playerId: string;
  tokenHash: string;
  name: string;
  avatarId: string;
  socketId: string | null;
  connected: boolean;
  left: boolean;
  side: PlayerSide;
}

interface ChessClock {
  w: number;
  b: number;
  running: ChessSide | null;
  updatedAt: number;
}

interface Room {
  code: string;
  game: OnlineGameId;
  status: RoomStatus;
  version: number;
  timeControl: TimeControlId;
  createdAt: number;
  lastActivityAt: number;
  disconnectDeadline: number | null;
  ratedApplied: boolean;
  seats: Seat[];
  chess: {
    fen: string;
    history: string[];
    lastMove: { from: Square; to: Square } | null;
    clocks: ChessClock | null;
  } | null;
  oAnQuan: {
    state: OAnQuanState;
    history: string[];
    lastMove: { pit: number; direction: Direction } | null;
    lastEvents: OAnQuanEvent[];
  } | null;
  result: {
    reason: string;
    winnerSide: PlayerSide | 'draw' | null;
    rated: boolean;
    changes: Record<string, RatingChange>;
  } | null;
}

export type ServiceResult =
  | { ok: true; room: Room }
  | { ok: false; error: string; code: string; room?: Room };

export class RoomService {
  readonly rooms = new Map<string, Room>();

  constructor(
    private ratings: PlayerRatingsPort,
    private now: () => number = Date.now,
  ) {}

  createRoom(session: PlayerSession, payload: CreateRoomPayload): ServiceResult {
    if (this.rooms.size >= MAX_ROOMS) {
      return { ok: false, error: 'Máy chủ đang đầy phòng. Thử lại sau.', code: 'BUSY' };
    }
    const game = payload.game === 'o-an-quan' ? 'o-an-quan' : 'chess';
    const timeControl: TimeControlId =
      game === 'chess' ? normalizeTimeControlId(payload.timeControl) : 'off';
    const code = generateRoomCode((value) => this.rooms.has(value));
    const hostSide = pickHostSide(game, payload.colorPref);
    const room: Room = {
      code,
      game,
      status: 'waiting',
      version: 0,
      timeControl,
      createdAt: this.now(),
      lastActivityAt: this.now(),
      disconnectDeadline: null,
      ratedApplied: false,
      seats: [makeSeat(session, hostSide)],
      chess:
        game === 'chess'
          ? {
              fen: startingFen(),
              history: [],
              lastMove: null,
              clocks: null,
            }
          : null,
      oAnQuan:
        game === 'o-an-quan'
          ? {
              state: createInitialState(),
              history: [],
              lastMove: null,
              lastEvents: [],
            }
          : null,
      result: null,
    };
    this.rooms.set(code, room);
    return { ok: true, room };
  }

  joinRoom(session: PlayerSession, rawCode: string): ServiceResult {
    const code = normalizeRoomCode(rawCode);
    if (!isPlausibleRoomCode(code)) {
      return { ok: false, error: 'Mã phòng không hợp lệ.', code: 'INVALID' };
    }
    const room = this.rooms.get(code);
    if (!room || room.status === 'abandoned') {
      return { ok: false, error: 'Phòng không tồn tại hoặc đã hết hạn.', code: 'ROOM_NOT_FOUND' };
    }
    const existing = room.seats.find((seat) => seat.playerId === session.playerId);
    if (existing) {
      if (existing.tokenHash !== session.tokenHash) {
        return { ok: false, error: 'Không xác thực được phiên người chơi.', code: 'UNAUTHORIZED' };
      }
      existing.connected = true;
      existing.left = false;
      existing.socketId = session.socketId;
      existing.name = session.name;
      existing.avatarId = session.avatarId;
      this.clearDisconnectIfReady(room);
      room.lastActivityAt = this.now();
      return { ok: true, room };
    }
    if (room.status === 'ended') {
      return { ok: false, error: 'Ván đấu đã kết thúc.', code: 'ROOM_ENDED' };
    }
    if (room.seats.length >= 2) {
      return { ok: false, error: 'Phòng đã đủ hai người chơi.', code: 'ROOM_FULL' };
    }
    const taken = room.seats[0]?.side;
    const joinerSide = otherSide(room.game, taken);
    room.seats.push(makeSeat(session, joinerSide));
    this.startGame(room);
    return { ok: true, room };
  }

  bindSocket(session: PlayerSession, code: string): ServiceResult {
    const room = this.rooms.get(normalizeRoomCode(code));
    if (!room) return { ok: false, error: 'Phòng không tồn tại.', code: 'ROOM_NOT_FOUND' };
    const seat = room.seats.find((item) => item.playerId === session.playerId);
    if (!seat || seat.tokenHash !== session.tokenHash) {
      return { ok: false, error: 'Bạn không thuộc phòng này.', code: 'UNAUTHORIZED' };
    }
    seat.socketId = session.socketId;
    seat.connected = true;
    seat.left = false;
    this.clearDisconnectIfReady(room);
    return { ok: true, room };
  }

  disconnect(playerId: string, socketId: string): Room[] {
    const changed: Room[] = [];
    for (const room of this.rooms.values()) {
      const seat = room.seats.find((item) => item.playerId === playerId && item.socketId === socketId);
      if (!seat) continue;
      seat.connected = false;
      seat.socketId = null;
      if (room.status === 'playing') {
        room.disconnectDeadline = this.now() + DISCONNECT_GRACE_MS;
      }
      room.lastActivityAt = this.now();
      changed.push(room);
    }
    return changed;
  }

  leaveRoom(session: PlayerSession, rawCode: string): ServiceResult {
    const room = this.rooms.get(normalizeRoomCode(rawCode));
    if (!room) return { ok: false, error: 'Phòng không tồn tại.', code: 'ROOM_NOT_FOUND' };
    const seat = room.seats.find((item) => item.playerId === session.playerId);
    if (!seat || seat.tokenHash !== session.tokenHash) {
      return { ok: false, error: 'Bạn không thuộc phòng này.', code: 'UNAUTHORIZED' };
    }
    seat.connected = false;
    seat.left = true;
    seat.socketId = null;
    if (room.status === 'waiting') {
      room.seats = room.seats.filter((item) => item.playerId !== session.playerId);
      if (room.seats.length === 0) {
        room.status = 'abandoned';
        this.rooms.delete(room.code);
      }
      return { ok: true, room };
    }
    if (room.status === 'playing') {
      room.disconnectDeadline = this.now() + LEAVE_GRACE_MS;
    }
    return { ok: true, room };
  }

  chessMove(
    session: PlayerSession,
    input: { code: string; from: Square; to: Square; promotion?: PieceSymbol; version: number },
  ): ServiceResult {
    const room = this.rooms.get(normalizeRoomCode(input.code));
    if (!room?.chess) return { ok: false, error: 'Phòng cờ vua không tồn tại.', code: 'ROOM_NOT_FOUND' };
    if (room.status !== 'playing') return { ok: false, error: 'Ván chưa bắt đầu hoặc đã kết thúc.', code: 'ROOM_ENDED', room };
    const seat = this.authorizeSeat(room, session);
    if (!seat) return { ok: false, error: 'Bạn không thuộc phòng này.', code: 'UNAUTHORIZED' };
    if (input.version !== room.version) {
      return { ok: false, error: 'Trạng thái đã cũ, đang đồng bộ lại.', code: 'STALE_STATE', room };
    }
    if (this.syncChessClock(room)) return { ok: true, room };
    const snapshot = getSnapshotFromFen(room.chess.fen);
    if (seat.side !== snapshot.turn) {
      return { ok: false, error: 'Không phải lượt của bạn.', code: 'NOT_YOUR_TURN', room };
    }
    try {
      const applied = applyChessMove(room.chess.fen, input.from, input.to, input.promotion);
      room.chess.fen = applied.fen;
      room.chess.history = [...room.chess.history, applied.san];
      room.chess.lastMove = { from: applied.from, to: applied.to };
      room.version += 1;
      room.lastActivityAt = this.now();
      if (room.chess.clocks) {
        room.chess.clocks.running = snapshot.turn === 'w' ? 'b' : 'w';
        room.chess.clocks.updatedAt = this.now();
      }
      const next = getSnapshotFromFen(room.chess.fen);
      if (next.isGameOver) {
        this.finishChessByRules(room, next.status, next.turn);
      }
      return { ok: true, room };
    } catch {
      return { ok: false, error: 'Nước đi không hợp lệ.', code: 'ILLEGAL_MOVE', room };
    }
  }

  oAnQuanMove(
    session: PlayerSession,
    input: { code: string; pit: number; direction: Direction; version: number },
  ): ServiceResult {
    const room = this.rooms.get(normalizeRoomCode(input.code));
    if (!room?.oAnQuan) return { ok: false, error: 'Phòng ô ăn quan không tồn tại.', code: 'ROOM_NOT_FOUND' };
    if (room.status !== 'playing') return { ok: false, error: 'Ván chưa bắt đầu hoặc đã kết thúc.', code: 'ROOM_ENDED', room };
    const seat = this.authorizeSeat(room, session);
    if (!seat) return { ok: false, error: 'Bạn không thuộc phòng này.', code: 'UNAUTHORIZED' };
    if (input.version !== room.version) {
      return { ok: false, error: 'Trạng thái đã cũ, đang đồng bộ lại.', code: 'STALE_STATE', room };
    }
    if (typeof seat.side !== 'number') {
      return { ok: false, error: 'Ghế chơi không hợp lệ.', code: 'UNAUTHORIZED', room };
    }
    if (input.direction !== 'cw' && input.direction !== 'ccw') {
      return { ok: false, error: 'Hướng rải không hợp lệ.', code: 'INVALID', room };
    }
    try {
      const result = applyMoveForPlayer(room.oAnQuan.state, input.pit, input.direction, seat.side);
      room.oAnQuan.state = result.state;
      room.oAnQuan.history = [...room.oAnQuan.history, result.description];
      room.oAnQuan.lastMove = { pit: input.pit, direction: input.direction };
      room.oAnQuan.lastEvents = result.events;
      room.version += 1;
      room.lastActivityAt = this.now();
      if (result.state.status === 'ended') {
        this.finish(room, {
          reason: result.state.endReason === 'cannot_resupply' ? 'Đối phương không đủ quân để tiếp' : 'Hết quân quan',
          winnerSide: result.state.winner === 'draw' ? 'draw' : result.state.winner,
          rated: true,
        });
      }
      return { ok: true, room };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nước đi không hợp lệ.';
      return { ok: false, error: message, code: 'ILLEGAL_MOVE', room };
    }
  }

  resign(session: PlayerSession, rawCode: string): ServiceResult {
    const room = this.rooms.get(normalizeRoomCode(rawCode));
    if (!room) return { ok: false, error: 'Phòng không tồn tại.', code: 'ROOM_NOT_FOUND' };
    if (room.status !== 'playing') return { ok: false, error: 'Ván chưa diễn ra.', code: 'ROOM_ENDED', room };
    const seat = this.authorizeSeat(room, session);
    if (!seat) return { ok: false, error: 'Bạn không thuộc phòng này.', code: 'UNAUTHORIZED' };
    this.finish(room, {
      reason: `${seat.name} đã đầu hàng`,
      winnerSide: otherSide(room.game, seat.side),
      rated: true,
    });
    return { ok: true, room };
  }

  tick(): Room[] {
    const changed: Room[] = [];
    const now = this.now();
    for (const room of [...this.rooms.values()]) {
      if (room.status === 'playing' && room.chess?.clocks) {
        const timedOut = this.syncChessClock(room);
        if (timedOut || room.chess.clocks.running) changed.push(room);
      }
      if (room.status === 'playing' && room.disconnectDeadline && now >= room.disconnectDeadline) {
        const disconnected = room.seats.filter((seat) => !seat.connected);
        if (disconnected.length === 1) {
          this.finish(room, {
            reason: disconnected[0].left ? 'Đối thủ đã rời phòng' : 'Đối thủ mất kết nối quá lâu',
            winnerSide: otherSide(room.game, disconnected[0].side),
            rated: Boolean(disconnected[0].left),
          });
          changed.push(room);
        } else if (disconnected.length >= 2) {
          this.finish(room, { reason: 'Cả hai người đã mất kết nối', winnerSide: 'draw', rated: false });
          room.status = 'abandoned';
          changed.push(room);
        }
      }
      if (now - room.lastActivityAt > ROOM_IDLE_MS) {
        room.status = 'abandoned';
        this.rooms.delete(room.code);
        changed.push(room);
      }
    }
    return changed;
  }

  publicState(room: Room, viewerId: string | null): RoomPublicState {
    const you = room.seats.find((seat) => seat.playerId === viewerId) ?? null;
    const chessSnap = room.chess ? getSnapshotFromFen(room.chess.fen) : null;
    return {
      code: room.code,
      game: room.game,
      status: room.status,
      version: room.version,
      timeControl: room.timeControl,
      you: you ? { playerId: you.playerId, side: you.side } : null,
      seats: room.seats.map((seat) => ({
        playerId: seat.playerId,
        name: seat.name,
        avatarId: seat.avatarId,
        connected: seat.connected,
        side: seat.side,
      })),
      waiting: room.status === 'waiting',
      chess: room.chess && chessSnap
        ? {
            fen: room.chess.fen,
            turn: chessSnap.turn,
            history: room.chess.history,
            lastMove: room.chess.lastMove,
            inCheck: chessSnap.inCheck,
            isGameOver: chessSnap.isGameOver || room.status === 'ended',
            status: chessSnap.status,
            clocks: room.chess.clocks
              ? { w: Math.max(0, room.chess.clocks.w), b: Math.max(0, room.chess.clocks.b), running: room.chess.clocks.running }
              : null,
          }
        : null,
      oAnQuan: room.oAnQuan
        ? {
            state: room.oAnQuan.state,
            history: room.oAnQuan.history,
            lastMove: room.oAnQuan.lastMove,
            lastEvents: room.oAnQuan.lastEvents,
          }
        : null,
      result: room.result
        ? {
            reason: room.result.reason,
            winnerSide: room.result.winnerSide,
            rated: room.result.rated,
            yourChange: viewerId ? room.result.changes[viewerId] ?? null : null,
          }
        : null,
      disconnectDeadline: room.disconnectDeadline,
      createdAt: room.createdAt,
    };
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(normalizeRoomCode(code));
  }

  private authorizeSeat(room: Room, session: PlayerSession): Seat | null {
    const seat = room.seats.find((item) => item.playerId === session.playerId);
    if (!seat || seat.tokenHash !== session.tokenHash) return null;
    return seat;
  }

  private startGame(room: Room): void {
    room.status = 'playing';
    room.lastActivityAt = this.now();
    room.disconnectDeadline = null;
    if (room.game === 'chess' && room.chess) {
      const budget = parseTimeControlBudgetMs(room.timeControl);
      room.chess.clocks =
        budget > 0
          ? { w: budget, b: budget, running: 'w', updatedAt: this.now() }
          : null;
    }
  }

  private syncChessClock(room: Room): boolean {
    const clocks = room.chess?.clocks;
    if (!clocks || !clocks.running || room.status !== 'playing') return false;
    const now = this.now();
    const elapsed = now - clocks.updatedAt;
    clocks[clocks.running] = Math.max(0, clocks[clocks.running] - elapsed);
    clocks.updatedAt = now;
    if (clocks[clocks.running] <= 0) {
      this.finish(room, {
        reason: clocks.running === 'w' ? 'Trắng hết giờ' : 'Đen hết giờ',
        winnerSide: clocks.running === 'w' ? 'b' : 'w',
        rated: true,
      });
      return true;
    }
    return false;
  }

  private finishChessByRules(room: Room, status: string, turn: ChessSide): void {
    if (status === 'checkmate') {
      this.finish(room, {
        reason: 'Chiếu hết',
        winnerSide: turn === 'w' ? 'b' : 'w',
        rated: true,
      });
      return;
    }
    this.finish(room, { reason: 'Hòa cờ', winnerSide: 'draw', rated: true });
  }

  private finish(
    room: Room,
    input: { reason: string; winnerSide: PlayerSide | 'draw' | null; rated: boolean },
  ): void {
    if (room.status === 'ended' || room.status === 'abandoned') return;
    room.status = 'ended';
    room.disconnectDeadline = null;
    room.lastActivityAt = this.now();
    if (room.chess?.clocks) room.chess.clocks.running = null;
    const changes: Record<string, RatingChange> = {};
    const rated = input.rated && room.seats.length === 2 && !room.ratedApplied;
    if (rated) {
      const matchId = `online:${room.code}`;
      const gameId = room.game;
      const before = new Map(
        room.seats.map((seat) => [
          seat.playerId,
          this.ratings.get(seat.playerId, { name: seat.name, avatarId: seat.avatarId }),
        ]),
      );
      for (const seat of room.seats) {
        const opponent = room.seats.find((item) => item.playerId !== seat.playerId);
        if (!opponent) continue;
        const current = before.get(seat.playerId);
        const opponentState = before.get(opponent.playerId);
        if (!current || !opponentState) continue;
        const result =
          input.winnerSide === 'draw' ? 'draw' : input.winnerSide === seat.side ? 'win' : 'loss';
        const applied = applyRatedGame(current, {
          matchId,
          gameId,
          finished: true,
          rated: true,
          result,
          opponentRating: opponentState.ratings[gameId].rating,
          opponentName: opponent.name,
        });
        if (applied.change) {
          this.ratings.save(applied.state);
          changes[seat.playerId] = applied.change;
        }
      }
      room.ratedApplied = true;
    }
    room.result = {
      reason: input.reason,
      winnerSide: input.winnerSide,
      rated,
      changes,
    };
  }

  private clearDisconnectIfReady(room: Room): void {
    if (room.seats.length === 2 && room.seats.every((seat) => seat.connected)) {
      room.disconnectDeadline = null;
    }
  }
}

function makeSeat(session: PlayerSession, side: PlayerSide): Seat {
  return {
    playerId: session.playerId,
    tokenHash: session.tokenHash,
    name: session.name,
    avatarId: session.avatarId,
    socketId: session.socketId,
    connected: true,
    left: false,
    side,
  };
}

function pickHostSide(game: OnlineGameId, pref: ColorPref | undefined): PlayerSide {
  if (game === 'o-an-quan') return 0;
  if (pref === 'w' || pref === 'b') return pref;
  return Math.random() < 0.5 ? 'w' : 'b';
}

function otherSide(game: OnlineGameId, side: PlayerSide | undefined): PlayerSide {
  if (game === 'o-an-quan') return side === 0 ? 1 : 0;
  return side === 'w' ? 'b' : 'w';
}
