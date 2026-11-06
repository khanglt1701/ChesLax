import { get, onDisconnect, onValue, ref, remove, runTransaction, set, update, type Unsubscribe } from 'firebase/database';
import {
  freshGame,
  isOnlineGameId,
  isRoomCode,
  reduceMove,
  restartGame,
  ROOM_TTL_MS,
  type GameAction,
  type OnlineGameId,
  type SyncedGame,
} from '@/features/multiplayer/gameSync';
import { ensurePlayer, getDb } from './firebaseConfig';

export interface RoomPlayer {
  nickname: string;
  seat: string;
  connected: boolean;
  joinedAt: number;
  lastSeen: number;
}

export interface RoomMetadata {
  gameType: OnlineGameId;
  hostId: string;
  hostSeat: string;
  guestSeat: string;
  guestId: string;
  status: 'waiting' | 'playing' | 'abandoned';
  createdAt: number;
  expiresAt: number;
}

export interface LiveRoom {
  metadata: RoomMetadata;
  players: Record<string, RoomPlayer>;
  game: SyncedGame | null;
}

export class RoomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoomError';
  }
}

export async function createRoom(input: {
  game: OnlineGameId;
  nickname: string;
  goesFirst: boolean;
  code: string;
}): Promise<void> {
  if (!isRoomCode(input.code)) throw new RoomError('Mã phòng không hợp lệ.');
  const uid = await ensurePlayer();
  const db = getDb();
  const existing = await get(ref(db, `rooms/${input.code}/metadata`));
  if (existing.exists()) throw new RoomError('Mã phòng vừa bị trùng. Thử lại.');
  const createdAt = Date.now();
  const hostSeat = input.goesFirst ? firstSeat(input.game) : secondSeat(input.game);
  const guestSeat = input.goesFirst ? secondSeat(input.game) : firstSeat(input.game);
  await set(ref(db, `rooms/${input.code}/metadata`), {
    gameType: input.game,
    hostId: uid,
    hostSeat,
    guestSeat,
    guestId: '',
    status: 'waiting',
    createdAt,
    expiresAt: createdAt + ROOM_TTL_MS,
  });
  try {
    await set(ref(db, `rooms/${input.code}/players/${uid}`), playerRecord(input.nickname, hostSeat));
  } catch (error) {
    await remove(ref(db, `rooms/${input.code}/metadata`)).catch(() => undefined);
    throw error;
  }
}

export async function joinRoom(code: string, nickname: string): Promise<void> {
  const uid = await ensurePlayer();
  const room = await readRoom(code);
  if (!room) throw new RoomError('Không thấy phòng này.');
  if (room.metadata.expiresAt < Date.now()) {
    await deleteExpired(code, room);
    throw new RoomError('Phòng đã hết hạn.');
  }
  if (room.players[uid]) return;
  if (room.metadata.hostId === uid) throw new RoomError('Bạn đã ở trong phòng.');
  if (room.metadata.status !== 'waiting') throw new RoomError('Phòng không còn nhận người chơi.');
  if (room.metadata.guestId && room.metadata.guestId !== uid) throw new RoomError('Phòng đã đủ hai người.');
  const claimed = Boolean(room.metadata.guestId);
  if (!claimed) {
    try {
      await update(ref(getDb(), `rooms/${code}/metadata`), { guestId: uid });
    } catch {
      throw new RoomError('Phòng đã đủ hai người.');
    }
  }
  try {
    await set(ref(getDb(), `rooms/${code}/players/${uid}`), playerRecord(nickname, room.metadata.guestSeat));
  } catch (error) {
    if (!claimed) await update(ref(getDb(), `rooms/${code}/metadata`), { guestId: '' }).catch(() => undefined);
    throw error;
  }
}

export function subscribeRoom(
  code: string,
  onRoom: (room: LiveRoom | null) => void,
  onError: (message: string) => void,
): Unsubscribe {
  return onValue(
    ref(getDb(), `rooms/${code}`),
    (snapshot) => {
      if (!snapshot.exists()) {
        onRoom(null);
        return;
      }
      const room = normalizeRoom(snapshot.val());
      if (!room) {
        onError('Dữ liệu phòng không đúng.');
        return;
      }
      if (room.metadata.expiresAt < Date.now()) {
        onRoom(null);
        void deleteExpired(code, room);
        onError('Phòng đã hết hạn.');
        return;
      }
      onRoom(room);
    },
    (error) => onError(error.message || 'Không đọc được phòng.'),
  );
}

export async function bindPresence(code: string, uid: string): Promise<() => void> {
  const playerRef = ref(getDb(), `rooms/${code}/players/${uid}`);
  const link = ref(getDb(), '.info/connected');
  const unsubscribe = onValue(link, (snapshot) => {
    if (snapshot.val() !== true) return;
    void onDisconnect(playerRef)
      .update({ connected: false, lastSeen: Date.now() })
      .then(() => update(playerRef, { connected: true, lastSeen: Date.now() }));
  });
  return () => unsubscribe();
}

export async function startMatch(code: string, room: LiveRoom): Promise<void> {
  const uid = await ensurePlayer();
  if (room.metadata.hostId !== uid) throw new RoomError('Chỉ chủ phòng bắt đầu được ván.');
  if (room.metadata.status !== 'waiting') throw new RoomError('Ván đã bắt đầu hoặc phòng đã đóng.');
  if (Object.keys(room.players).length < 2) throw new RoomError('Cần đủ hai người trước khi bắt đầu.');
  const game = freshGame(room.metadata.gameType, uid);
  await update(ref(getDb()), {
    [`rooms/${code}/game`]: game,
    [`rooms/${code}/metadata`]: { ...room.metadata, status: 'playing' },
  });
}

export async function restartMatch(code: string, room: LiveRoom): Promise<void> {
  const uid = await ensurePlayer();
  if (room.metadata.hostId !== uid) throw new RoomError('Chỉ chủ phòng chơi lại được.');
  if (!room.game) throw new RoomError('Ván chưa bắt đầu.');
  const result = await runTransaction(ref(getDb(), `rooms/${code}/game`), (current) => {
    if (!current || typeof current !== 'object') return;
    return restartGame(room.metadata.gameType, current as SyncedGame, uid);
  });
  if (!result.committed) throw new RoomError('Chưa chơi lại được.');
}

export async function submitMove(code: string, room: LiveRoom, action: GameAction, seat: string): Promise<void> {
  const uid = await ensurePlayer();
  if (!room.game || room.game.status !== 'playing') throw new RoomError('Ván chưa diễn ra.');
  if (room.game.turn !== seat) throw new RoomError('Chưa đến lượt của bạn.');
  const preview = reduceMove(room.metadata.gameType, room.game, action, uid, seat);
  if (!preview) throw new RoomError('Nước đi không hợp lệ.');
  const result = await runTransaction(ref(getDb(), `rooms/${code}/game`), (current) => {
    if (!current || typeof current !== 'object') return;
    return reduceMove(room.metadata.gameType, current as SyncedGame, action, uid, seat) ?? undefined;
  });
  if (!result.committed) throw new RoomError('Nước đi bị từ chối vì bàn đã đổi.');
}

export async function leaveRoom(code: string, room: LiveRoom | null, uid: string): Promise<void> {
  const playerRef = ref(getDb(), `rooms/${code}/players/${uid}`);
  await onDisconnect(playerRef).cancel().catch(() => undefined);
  if (room && room.metadata.hostId === uid && room.metadata.status !== 'abandoned') {
    await update(ref(getDb(), `rooms/${code}/metadata`), { status: 'abandoned' }).catch(() => undefined);
  }
  await remove(playerRef);
}

async function readRoom(code: string): Promise<LiveRoom | null> {
  if (!isRoomCode(code)) throw new RoomError('Mã phòng không hợp lệ.');
  let snapshot;
  try {
    snapshot = await get(ref(getDb(), `rooms/${code}`));
  } catch {
    throw new RoomError('Không vào được phòng. Mã không đúng, hoặc ván đã bắt đầu với người khác.');
  }
  if (!snapshot.exists()) return null;
  return normalizeRoom(snapshot.val());
}

async function deleteExpired(code: string, room: LiveRoom): Promise<void> {
  const payload: Record<string, null> = {
    [`rooms/${code}/metadata`]: null,
    [`rooms/${code}/game`]: null,
  };
  for (const playerId of Object.keys(room.players)) payload[`rooms/${code}/players/${playerId}`] = null;
  await update(ref(getDb()), payload).catch(() => undefined);
}

function playerRecord(nickname: string, seat: string): RoomPlayer {
  const now = Date.now();
  const trimmed = nickname.trim().slice(0, 24);
  return {
    nickname: trimmed || 'Người chơi',
    seat,
    connected: true,
    joinedAt: now,
    lastSeen: now,
  };
}

function firstSeat(game: OnlineGameId): string {
  if (game === 'chess') return 'w';
  if (game === 'co-tuong') return 'r';
  if (game === 'co-ganh') return 'red';
  if (game === 'caro') return 'x';
  return '0';
}

function secondSeat(game: OnlineGameId): string {
  if (game === 'chess') return 'b';
  if (game === 'co-tuong') return 'b';
  if (game === 'co-ganh') return 'blue';
  if (game === 'caro') return 'o';
  return '1';
}

function normalizeRoom(value: unknown): LiveRoom | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as { metadata?: RoomMetadata; players?: Record<string, RoomPlayer>; game?: SyncedGame };
  const metadata = record.metadata;
  if (!metadata || !isOnlineGameId(metadata.gameType) || typeof metadata.hostId !== 'string') return null;
  return {
    metadata: { ...metadata, guestId: typeof metadata.guestId === 'string' ? metadata.guestId : '' },
    players: record.players && typeof record.players === 'object' ? record.players : {},
    game: record.game && typeof record.game.state === 'string' ? record.game : null,
  };
}
