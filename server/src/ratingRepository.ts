import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { AVATAR_IDS, createInitialRatingState } from '../../src/ranking/ratingEngine';
import type { PlayerRatingState } from '../../src/ranking/ratingTypes';

export interface PlayerRatingsPort {
  get(playerId: string, profile: { name: string; avatarId: string }): PlayerRatingState;
  save(state: PlayerRatingState): void;
}

function sanitizeAvatar(avatarId: string): string {
  return AVATAR_IDS.includes(avatarId as (typeof AVATAR_IDS)[number]) ? avatarId : 'seal-1';
}

export class MemoryRatingRepository implements PlayerRatingsPort {
  private data = new Map<string, PlayerRatingState>();

  get(playerId: string, profile: { name: string; avatarId: string }): PlayerRatingState {
    const existing = this.data.get(playerId);
    const player = {
      id: playerId,
      name: profile.name.trim().slice(0, 24) || 'Kỳ thủ Cheslax',
      avatarId: sanitizeAvatar(profile.avatarId),
    };
    if (existing) {
      const next = { ...existing, player };
      this.data.set(playerId, next);
      return next;
    }
    const created = { ...createInitialRatingState(), player };
    this.data.set(playerId, created);
    return created;
  }

  save(state: PlayerRatingState): void {
    this.data.set(state.player.id, state);
  }
}

export class FileRatingRepository implements PlayerRatingsPort {
  private cache: Record<string, PlayerRatingState> | null = null;
  private memory = new MemoryRatingRepository();

  constructor(private filePath: string) {}

  private loadAll(): Record<string, PlayerRatingState> {
    if (this.cache) return this.cache;
    try {
      this.cache = JSON.parse(readFileSync(this.filePath, 'utf8')) as Record<string, PlayerRatingState>;
      for (const state of Object.values(this.cache)) this.memory.save(state);
    } catch {
      this.cache = {};
    }
    return this.cache;
  }

  private persist(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.cache ?? {}, null, 2), 'utf8');
  }

  get(playerId: string, profile: { name: string; avatarId: string }): PlayerRatingState {
    this.loadAll();
    const state = this.memory.get(playerId, profile);
    this.cache = { ...(this.cache ?? {}), [playerId]: state };
    this.persist();
    return state;
  }

  save(state: PlayerRatingState): void {
    this.loadAll();
    this.memory.save(state);
    this.cache = { ...(this.cache ?? {}), [state.player.id]: state };
    this.persist();
  }
}
