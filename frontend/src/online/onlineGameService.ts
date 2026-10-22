import { io, type Socket } from 'socket.io-client';
import {
  SOCKET_EVENTS,
  type Ack,
  type ChessMovePayload,
  type CreateRoomPayload,
  type OAnQuanMovePayload,
  type RoomPublicState,
} from './protocol';
import { loadOnlineIdentity } from './playerSession';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

export interface OnlineSnapshot {
  connection: ConnectionStatus;
  room: RoomPublicState | null;
  lastError: string | null;
}

type Listener = () => void;

const SERVER_DOWN_MESSAGE =
  'Không kết nối được máy chủ. Chạy `npm run dev` (gồm frontend và backend) rồi tải lại trang.';

class OnlineGameService {
  private socket: Socket | null = null;
  private listeners = new Set<Listener>();
  private profile = { name: 'Kỳ thủ Cheslax', avatarId: 'seal-1' };
  private pendingCode: string | null = null;
  connection: ConnectionStatus = 'idle';
  room: RoomPublicState | null = null;
  lastError: string | null = null;
  private cached: OnlineSnapshot = { connection: 'idle', room: null, lastError: null };

  snapshot(): OnlineSnapshot {
    return this.cached;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.cached = {
      connection: this.connection,
      room: this.room,
      lastError: this.lastError,
    };
    for (const listener of this.listeners) listener();
  }

  async connect(profile: { name: string; avatarId: string }): Promise<void> {
    this.profile = profile;
    if (this.socket?.connected) {
      await this.hello();
      return;
    }
    if (this.socket) return;
    this.connection = 'connecting';
    this.notify();
    const url = import.meta.env.VITE_SERVER_URL || window.location.origin;
    this.socket = io(url, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 30,
      reconnectionDelay: 700,
    });
    this.socket.on('connect', () => {
      this.connection = 'connected';
      this.lastError = null;
      this.notify();
      void this.hello().then(() => {
        const code = this.pendingCode ?? this.room?.code;
        if (code) return this.joinRoom(code);
      });
    });
    this.socket.on('disconnect', () => {
      this.connection = 'disconnected';
      this.notify();
    });
    this.socket.on('connect_error', () => {
      this.connection = 'disconnected';
      this.lastError = SERVER_DOWN_MESSAGE;
      this.notify();
    });
    this.socket.on(SOCKET_EVENTS.roomState, (room: RoomPublicState | null) => {
      this.room = room;
      this.notify();
    });
  }

  rememberCode(code: string | null): void {
    this.pendingCode = code;
  }

  async createRoom(payload: CreateRoomPayload): Promise<Ack> {
    const result = await this.emitAck<Ack>(SOCKET_EVENTS.createRoom, payload);
    if (result.ok && result.room) {
      this.room = result.room;
      this.pendingCode = result.room.code;
      this.notify();
    } else {
      this.lastError = result.error ?? 'Không tạo được phòng.';
      this.notify();
    }
    return result;
  }

  async joinRoom(code: string): Promise<Ack> {
    this.pendingCode = code;
    const result = await this.emitAck<Ack>(SOCKET_EVENTS.joinRoom, { code });
    if (result.ok && result.room) {
      this.room = result.room;
      this.lastError = null;
    } else {
      this.lastError = result.error ?? 'Không vào được phòng.';
      if (result.room) this.room = result.room;
    }
    this.notify();
    return result;
  }

  async chessMove(payload: Omit<ChessMovePayload, 'code'>): Promise<Ack> {
    const code = this.room?.code;
    if (!code) return { ok: false, error: 'Chưa ở trong phòng.' };
    const result = await this.emitAck<Ack>(SOCKET_EVENTS.chessMove, { ...payload, code });
    if (result.room) this.room = result.room;
    if (!result.ok) this.lastError = result.error ?? 'Nước đi bị từ chối.';
    this.notify();
    return result;
  }

  async oAnQuanMove(payload: Omit<OAnQuanMovePayload, 'code'>): Promise<Ack> {
    const code = this.room?.code;
    if (!code) return { ok: false, error: 'Chưa ở trong phòng.' };
    const result = await this.emitAck<Ack>(SOCKET_EVENTS.oAnQuanMove, { ...payload, code });
    if (result.room) this.room = result.room;
    if (!result.ok) this.lastError = result.error ?? 'Nước đi bị từ chối.';
    this.notify();
    return result;
  }

  async resign(): Promise<Ack> {
    const code = this.room?.code;
    if (!code) return { ok: false, error: 'Chưa ở trong phòng.' };
    const result = await this.emitAck<Ack>(SOCKET_EVENTS.resign, { code });
    if (result.room) this.room = result.room;
    this.notify();
    return result;
  }

  async leave(): Promise<void> {
    const code = this.room?.code;
    if (code) await this.emitAck<Ack>(SOCKET_EVENTS.leaveRoom, { code }).catch(() => undefined);
    this.room = null;
    this.pendingCode = null;
    this.notify();
  }

  private async hello(): Promise<void> {
    const identity = loadOnlineIdentity();
    await this.emitAck(SOCKET_EVENTS.hello, {
      playerId: identity.playerId,
      token: identity.token,
      name: this.profile.name,
      avatarId: this.profile.avatarId,
    });
  }

  private emitAck<T>(event: string, payload: unknown, timeoutMs = 8_000): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error(SERVER_DOWN_MESSAGE));
        return;
      }
      const timer = window.setTimeout(() => {
        reject(new Error('Máy chủ không phản hồi.'));
      }, timeoutMs);
      this.socket.emit(event, payload, (result: T) => {
        window.clearTimeout(timer);
        resolve(result);
      });
    });
  }
}

export const onlineGameService = new OnlineGameService();
