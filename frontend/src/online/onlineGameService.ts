import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { resolveApiBaseUrl } from '@/services/apiClient';
import {
  type Ack,
  type ChessMovePayload,
  type CreateRoomPayload,
  type OAnQuanMovePayload,
  type CaroMovePayload,
  type RoomPublicState,
} from './protocol';
import {
  cancelRanked,
  chessMove,
  createCasualRoom,
  enqueueRanked,
  ensureGuestSession,
  getRankedStatus,
  joinRoom,
  leaveRoom,
  mapRoomDto,
  oAnQuanMove,
  caroMove,
  resignRoom,
  toAck,
  type QueueStatusDto,
  type RoomDto,
} from '@/services/playService';
import type { OnlineGameId } from './protocol';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

export interface OnlineSnapshot {
  connection: ConnectionStatus;
  room: RoomPublicState | null;
  lastError: string | null;
  queue: QueueStatusDto | null;
}

type Listener = () => void;

const SERVER_DOWN_MESSAGE =
  'Không kết nối được máy chủ. Chạy API Cheslax rồi tải lại trang.';

class OnlineGameService {
  private hub: HubConnection | null = null;
  private listeners = new Set<Listener>();
  private profile = { name: 'Kỳ thủ Cheslax', avatarId: 'seal-1' };
  private pendingCode: string | null = null;
  private startPromise: Promise<void> | null = null;
  connection: ConnectionStatus = 'idle';
  room: RoomPublicState | null = null;
  lastError: string | null = null;
  queue: QueueStatusDto | null = null;
  private cached: OnlineSnapshot = { connection: 'idle', room: null, lastError: null, queue: null };

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
      queue: this.queue,
    };
    for (const listener of this.listeners) listener();
  }

  async connect(
    profile: { name: string; avatarId: string },
    options: { guest?: boolean } = {},
  ): Promise<void> {
    this.profile = profile;
    if (options.guest !== false) {
      try {
        await ensureGuestSession(profile);
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : SERVER_DOWN_MESSAGE;
        this.notify();
      }
    }
    await this.startHub();
  }

  rememberCode(code: string | null): void {
    this.pendingCode = code;
  }

  async createRoom(payload: CreateRoomPayload): Promise<Ack> {
    try {
      await this.connect(this.profile);
      const dto = await createCasualRoom({
        gameId: payload.game,
        colorPref: payload.colorPref,
        timeControl: payload.timeControl,
      });
      this.applyRoom(dto);
      await this.joinHubRoom(dto.code);
      return { ok: true, room: this.room ?? undefined };
    } catch (error) {
      const ack = toAck(error, 'Không tạo được phòng.');
      this.lastError = ack.error ?? null;
      this.notify();
      return ack;
    }
  }

  async joinRoom(code: string): Promise<Ack> {
    this.pendingCode = code;
    try {
      await this.connect(this.profile);
      const dto = await joinRoom(code);
      this.applyRoom(dto);
      await this.joinHubRoom(dto.code);
      return { ok: true, room: this.room ?? undefined };
    } catch (error) {
      const ack = toAck(error, 'Không vào được phòng.');
      this.lastError = ack.error ?? null;
      this.notify();
      return ack;
    }
  }

  async chessMove(payload: Omit<ChessMovePayload, 'code'>): Promise<Ack> {
    const code = this.room?.code;
    if (!code) return { ok: false, error: 'Chưa ở trong phòng.' };
    try {
      this.applyRoom(await chessMove(code, payload));
      return { ok: true, room: this.room ?? undefined };
    } catch (error) {
      const ack = toAck(error, 'Nước đi bị từ chối.');
      this.lastError = ack.error ?? null;
      this.notify();
      return ack;
    }
  }

  async oAnQuanMove(payload: Omit<OAnQuanMovePayload, 'code'>): Promise<Ack> {
    const code = this.room?.code;
    if (!code) return { ok: false, error: 'Chưa ở trong phòng.' };
    try {
      this.applyRoom(await oAnQuanMove(code, payload));
      return { ok: true, room: this.room ?? undefined };
    } catch (error) {
      const ack = toAck(error, 'Nước đi bị từ chối.');
      this.lastError = ack.error ?? null;
      this.notify();
      return ack;
    }
  }

  async caroMove(payload: Omit<CaroMovePayload, 'code'>): Promise<Ack> {
    const code = this.room?.code;
    if (!code) return { ok: false, error: 'Chưa ở trong phòng.' };
    try {
      this.applyRoom(await caroMove(code, payload));
      return { ok: true, room: this.room ?? undefined };
    } catch (error) {
      const ack = toAck(error, 'Nước đi bị từ chối.');
      this.lastError = ack.error ?? null;
      this.notify();
      return ack;
    }
  }

  async resign(): Promise<Ack> {
    const code = this.room?.code;
    if (!code) return { ok: false, error: 'Chưa ở trong phòng.' };
    try {
      this.applyRoom(await resignRoom(code));
      return { ok: true, room: this.room ?? undefined };
    } catch (error) {
      const ack = toAck(error, 'Không đầu hàng được.');
      this.lastError = ack.error ?? null;
      this.notify();
      return ack;
    }
  }

  async leave(): Promise<void> {
    const code = this.room?.code;
    if (code) {
      try {
        await this.hub?.invoke('LeaveRoom', code);
      } catch {
        await leaveRoom(code).catch(() => undefined);
      }
    }
    this.room = null;
    this.pendingCode = null;
    this.notify();
  }

  async enqueueRanked(gameId: OnlineGameId): Promise<QueueStatusDto> {
    await this.connect(this.profile, { guest: false });
    const status = await enqueueRanked(gameId);
    this.queue = status;
    this.lastError = null;
    this.notify();
    return status;
  }

  async cancelQueue(): Promise<void> {
    await cancelRanked();
    this.queue = null;
    this.notify();
  }

  async refreshQueue(): Promise<QueueStatusDto | null> {
    const status = await getRankedStatus();
    this.queue = status;
    this.notify();
    return status;
  }

  private applyRoom(dto: RoomDto): void {
    this.room = mapRoomDto(dto);
    this.pendingCode = dto.code;
    this.lastError = null;
    this.notify();
  }

  private async startHub(): Promise<void> {
    if (this.hub?.state === HubConnectionState.Connected) return;
    if (this.startPromise) {
      await this.startPromise;
      return;
    }
    this.connection = 'connecting';
    this.notify();
    this.startPromise = this.openHub();
    try {
      await this.startPromise;
    } finally {
      this.startPromise = null;
    }
  }

  private async openHub(): Promise<void> {
    if (!this.hub) {
      this.hub = new HubConnectionBuilder()
        .withUrl(`${resolveApiBaseUrl()}/hubs/game`, { withCredentials: true })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();
      this.hub.on('RoomState', (dto: RoomDto) => {
        this.applyRoom(dto);
      });
      this.hub.on('QueueStatus', (status: QueueStatusDto) => {
        this.queue = status;
        this.notify();
      });
      this.hub.on('MatchFound', (found: NonNullable<QueueStatusDto['match']>) => {
        this.queue = {
          status: 'matched',
          gameId: found.gameId,
          rating: this.queue?.rating ?? 0,
          waitedSeconds: this.queue?.waitedSeconds ?? 0,
          allowedSpread: this.queue?.allowedSpread ?? 0,
          enqueuedAt: this.queue?.enqueuedAt ?? new Date().toISOString(),
          match: found,
        };
        this.notify();
      });
      this.hub.onreconnecting(() => {
        this.connection = 'connecting';
        this.notify();
      });
      this.hub.onreconnected(() => {
        this.connection = 'connected';
        this.lastError = null;
        this.notify();
        const code = this.pendingCode ?? this.room?.code;
        if (code) void this.joinHubRoom(code);
      });
      this.hub.onclose(() => {
        this.connection = 'disconnected';
        this.notify();
      });
    }

    try {
      if (this.hub.state === HubConnectionState.Disconnected) {
        await this.hub.start();
      }
      this.connection = 'connected';
      this.lastError = null;
      this.notify();
      const code = this.pendingCode ?? this.room?.code;
      if (code) await this.joinHubRoom(code);
    } catch {
      this.connection = 'disconnected';
      this.lastError = SERVER_DOWN_MESSAGE;
      this.notify();
      throw new Error(SERVER_DOWN_MESSAGE);
    }
  }

  private async joinHubRoom(code: string): Promise<void> {
    if (!this.hub || this.hub.state !== HubConnectionState.Connected) return;
    try {
      await this.hub.invoke('JoinRoom', code);
    } catch {
      // HTTP already joined; live updates still arrive via Clients.User.
    }
  }
}

export const onlineGameService = new OnlineGameService();
