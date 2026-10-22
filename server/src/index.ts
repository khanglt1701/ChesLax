import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { AVATAR_IDS } from '../../frontend/src/ranking/ratingEngine';
import {
  SOCKET_EVENTS,
  type ChessMovePayload,
  type CreateRoomPayload,
  type HelloPayload,
  type JoinRoomPayload,
  type OAnQuanMovePayload,
  type ResignPayload,
} from '../../frontend/src/online/protocol';
import { hashToken } from './hash';
import { RateLimiter } from './rateLimit';
import { FileRatingRepository } from './ratingRepository';
import { RoomService, type PlayerSession } from './roomService';

const PORT = Number(process.env.PORT ?? 3001);
const CORS_ORIGIN = process.env.CORS_ORIGIN?.split(',').filter(Boolean) ?? true;

const dataFile = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'ratings.json');
const rooms = new RoomService(new FileRatingRepository(dataFile));
const limiter = new RateLimiter();
const sessions = new Map<string, PlayerSession>();

const app = express();
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, rooms: rooms.rooms.size });
});

app.get('/api/rooms/:code', (req, res) => {
  const room = rooms.getRoom(String(req.params.code ?? ''));
  if (!room || room.status === 'abandoned') {
    res.status(404).json({ ok: false, error: 'Phòng không tồn tại hoặc đã hết hạn.' });
    return;
  }
  res.json({ ok: true, room: rooms.publicState(room, null) });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, credentials: true },
  pingTimeout: 20_000,
  pingInterval: 10_000,
});

function emitRoom(roomCode: string): void {
  const room = rooms.getRoom(roomCode);
  if (!room) {
    io.to(`room:${roomCode}`).emit(SOCKET_EVENTS.roomState, null);
    return;
  }
  for (const seat of room.seats) {
    if (!seat.socketId) continue;
    io.to(seat.socketId).emit(SOCKET_EVENTS.roomState, rooms.publicState(room, seat.playerId));
  }
}

function requireSession(socketId: string): PlayerSession | null {
  return sessions.get(socketId) ?? null;
}

io.on('connection', (socket) => {
  socket.on(SOCKET_EVENTS.hello, (payload: HelloPayload, ack?: (value: unknown) => void) => {
    const session = parseHello(payload, socket.id);
    if (!session) {
      ack?.({ ok: false, error: 'Phiên đăng nhập phòng không hợp lệ.', code: 'INVALID' });
      return;
    }
    sessions.set(socket.id, session);
    ack?.({ ok: true, playerId: session.playerId });
  });

  socket.on(SOCKET_EVENTS.createRoom, (payload: CreateRoomPayload, ack?: (value: unknown) => void) => {
    const session = requireSession(socket.id);
    if (!session) {
      ack?.({ ok: false, error: 'Chưa xác thực phiên.', code: 'UNAUTHORIZED' });
      return;
    }
    if (!limiter.allow(session.playerId, Date.now())) {
      ack?.({ ok: false, error: 'Bạn thao tác quá nhanh.', code: 'RATE_LIMITED' });
      return;
    }
    const result = rooms.createRoom(session, payload ?? { game: 'chess' });
    if (!result.ok) {
      ack?.(result);
      return;
    }
    void socket.join(`room:${result.room.code}`);
    const publicRoom = rooms.publicState(result.room, session.playerId);
    ack?.({ ok: true, room: publicRoom });
    emitRoom(result.room.code);
  });

  socket.on(SOCKET_EVENTS.joinRoom, (payload: JoinRoomPayload, ack?: (value: unknown) => void) => {
    const session = requireSession(socket.id);
    if (!session) {
      ack?.({ ok: false, error: 'Chưa xác thực phiên.', code: 'UNAUTHORIZED' });
      return;
    }
    if (!limiter.allow(session.playerId, Date.now())) {
      ack?.({ ok: false, error: 'Bạn thao tác quá nhanh.', code: 'RATE_LIMITED' });
      return;
    }
    const result = rooms.joinRoom(session, payload?.code ?? '');
    if (!result.ok) {
      ack?.(result);
      return;
    }
    void socket.join(`room:${result.room.code}`);
    ack?.({ ok: true, room: rooms.publicState(result.room, session.playerId) });
    emitRoom(result.room.code);
  });

  socket.on(SOCKET_EVENTS.leaveRoom, (payload: ResignPayload, ack?: (value: unknown) => void) => {
    const session = requireSession(socket.id);
    if (!session) {
      ack?.({ ok: false, error: 'Chưa xác thực phiên.', code: 'UNAUTHORIZED' });
      return;
    }
    const result = rooms.leaveRoom(session, payload?.code ?? '');
    void socket.leave(`room:${payload?.code ?? ''}`);
    ack?.(result.ok ? { ok: true, room: rooms.publicState(result.room, session.playerId) } : result);
    if (result.ok) emitRoom(result.room.code);
  });

  socket.on(SOCKET_EVENTS.chessMove, (payload: ChessMovePayload, ack?: (value: unknown) => void) => {
    const session = requireSession(socket.id);
    if (!session) {
      ack?.({ ok: false, error: 'Chưa xác thực phiên.', code: 'UNAUTHORIZED' });
      return;
    }
    if (!limiter.allow(session.playerId, Date.now(), 8_000, 25)) {
      ack?.({ ok: false, error: 'Bạn thao tác quá nhanh.', code: 'RATE_LIMITED' });
      return;
    }
    const result = rooms.chessMove(session, {
      code: payload?.code ?? '',
      from: payload?.from,
      to: payload?.to,
      promotion: payload?.promotion,
      version: Number(payload?.version),
    });
    if (result.ok) {
      ack?.({ ok: true, room: rooms.publicState(result.room, session.playerId) });
      emitRoom(result.room.code);
      return;
    }
    ack?.({
      ok: false,
      error: result.error,
      code: result.code,
      room: result.room ? rooms.publicState(result.room, session.playerId) : undefined,
    });
    if (result.room) emitRoom(result.room.code);
  });

  socket.on(SOCKET_EVENTS.oAnQuanMove, (payload: OAnQuanMovePayload, ack?: (value: unknown) => void) => {
    const session = requireSession(socket.id);
    if (!session) {
      ack?.({ ok: false, error: 'Chưa xác thực phiên.', code: 'UNAUTHORIZED' });
      return;
    }
    if (!limiter.allow(session.playerId, Date.now(), 8_000, 25)) {
      ack?.({ ok: false, error: 'Bạn thao tác quá nhanh.', code: 'RATE_LIMITED' });
      return;
    }
    const result = rooms.oAnQuanMove(session, {
      code: payload?.code ?? '',
      pit: Number(payload?.pit),
      direction: payload?.direction,
      version: Number(payload?.version),
    });
    if (result.ok) {
      ack?.({ ok: true, room: rooms.publicState(result.room, session.playerId) });
      emitRoom(result.room.code);
      return;
    }
    ack?.({
      ok: false,
      error: result.error,
      code: result.code,
      room: result.room ? rooms.publicState(result.room, session.playerId) : undefined,
    });
  });

  socket.on(SOCKET_EVENTS.resign, (payload: ResignPayload, ack?: (value: unknown) => void) => {
    const session = requireSession(socket.id);
    if (!session) {
      ack?.({ ok: false, error: 'Chưa xác thực phiên.', code: 'UNAUTHORIZED' });
      return;
    }
    const result = rooms.resign(session, payload?.code ?? '');
    if (result.ok) {
      ack?.({ ok: true, room: rooms.publicState(result.room, session.playerId) });
      emitRoom(result.room.code);
      return;
    }
    ack?.(result);
  });

  socket.on('disconnect', () => {
    const session = sessions.get(socket.id);
    sessions.delete(socket.id);
    if (!session) return;
    const changed = rooms.disconnect(session.playerId, socket.id);
    for (const room of changed) emitRoom(room.code);
  });
});

setInterval(() => {
  const changed = rooms.tick();
  for (const room of changed) emitRoom(room.code);
}, 1000);

httpServer.listen(PORT, () => {
  console.log(`Cheslax server listening on http://127.0.0.1:${PORT}`);
});

function parseHello(payload: HelloPayload, socketId: string): PlayerSession | null {
  if (!payload || typeof payload !== 'object') return null;
  const playerId = String(payload.playerId ?? '').trim();
  const token = String(payload.token ?? '').trim();
  const name = String(payload.name ?? '').trim().slice(0, 24);
  const avatarId = String(payload.avatarId ?? 'seal-1');
  if (playerId.length < 8 || playerId.length > 80) return null;
  if (token.length < 16 || token.length > 128) return null;
  if (!name) return null;
  return {
    playerId,
    tokenHash: hashToken(token),
    name,
    avatarId: AVATAR_IDS.includes(avatarId as (typeof AVATAR_IDS)[number]) ? avatarId : 'seal-1',
    socketId,
  };
}
