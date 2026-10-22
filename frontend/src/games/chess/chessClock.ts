export interface ChessTimeSettings {
  gameTimeMs: number;
  incrementMs: number;
  moveTimeMs: number;
}

export interface ClockState {
  gameRemainingMs: { w: number; b: number };
  moveRemainingMs: number;
  timedOut: 'w' | 'b' | null;
}

export const DEFAULT_CHESS_SETTINGS: ChessTimeSettings = {
  gameTimeMs: 10 * 60 * 1000,
  incrementMs: 0,
  moveTimeMs: 0,
};

export interface TimeControlPreset {
  id: string;
  label: string;
  gameTimeMs: number;
  incrementMs: number;
}

export const TIME_CONTROL_PRESETS: TimeControlPreset[] = [
  { id: 'off', label: 'Không giới hạn', gameTimeMs: 0, incrementMs: 0 },
  { id: '1+0', label: '1+0', gameTimeMs: 60_000, incrementMs: 0 },
  { id: '3+0', label: '3+0', gameTimeMs: 3 * 60 * 1000, incrementMs: 0 },
  { id: '3+2', label: '3+2', gameTimeMs: 3 * 60 * 1000, incrementMs: 2_000 },
  { id: '5+0', label: '5+0', gameTimeMs: 5 * 60 * 1000, incrementMs: 0 },
  { id: '10+0', label: '10+0', gameTimeMs: 10 * 60 * 1000, incrementMs: 0 },
];

export function timeControlPresetsFromApi(
  dtos: { id: string; label: string; baseSeconds: number; incrementSeconds: number }[],
): TimeControlPreset[] {
  if (!dtos.length) return TIME_CONTROL_PRESETS;
  return dtos.map((dto) => ({
    id: dto.id,
    label: dto.label,
    gameTimeMs: Math.max(0, dto.baseSeconds) * 1000,
    incrementMs: Math.max(0, dto.incrementSeconds) * 1000,
  }));
}

export const GAME_TIME_PRESETS = TIME_CONTROL_PRESETS.map((preset) => ({
  id: preset.id,
  label: preset.label,
  ms: preset.gameTimeMs,
}));

export const MOVE_TIME_PRESETS = [
  { id: 'off', label: 'Không giới hạn', ms: 0 },
  { id: '10s', label: '10 giây', ms: 10_000 },
  { id: '30s', label: '30 giây', ms: 30_000 },
  { id: '60s', label: '1 phút', ms: 60_000 },
  { id: '120s', label: '2 phút', ms: 120_000 },
] as const;

export function createClockState(settings: ChessTimeSettings): ClockState {
  return {
    gameRemainingMs: {
      w: settings.gameTimeMs,
      b: settings.gameTimeMs,
    },
    moveRemainingMs: settings.moveTimeMs,
    timedOut: null,
  };
}

export function hasAnyClock(settings: ChessTimeSettings): boolean {
  return settings.gameTimeMs > 0 || settings.moveTimeMs > 0;
}

export function tickClock(
  state: ClockState,
  settings: ChessTimeSettings,
  turn: 'w' | 'b',
  elapsedMs: number,
): ClockState {
  if (state.timedOut || elapsedMs <= 0) return state;

  const nextGame = { ...state.gameRemainingMs };
  let moveRemainingMs = state.moveRemainingMs;

  if (settings.gameTimeMs > 0) {
    nextGame[turn] = Math.max(0, nextGame[turn] - elapsedMs);
  }
  if (settings.moveTimeMs > 0) {
    moveRemainingMs = Math.max(0, moveRemainingMs - elapsedMs);
  }

  const timedOut =
    (settings.gameTimeMs > 0 && nextGame[turn] <= 0) || (settings.moveTimeMs > 0 && moveRemainingMs <= 0)
      ? turn
      : null;

  return {
    gameRemainingMs: nextGame,
    moveRemainingMs,
    timedOut,
  };
}

export function afterMoveClock(state: ClockState, settings: ChessTimeSettings, moved?: 'w' | 'b'): ClockState {
  const nextGame = { ...state.gameRemainingMs };
  if (moved && settings.incrementMs > 0 && !state.timedOut) {
    nextGame[moved] += settings.incrementMs;
  }
  return {
    gameRemainingMs: nextGame,
    moveRemainingMs: settings.moveTimeMs,
    timedOut: state.timedOut,
  };
}

export function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  if (clamped > 0 && clamped < 10_000) {
    return (clamped / 1000).toFixed(1);
  }
  const totalSeconds = Math.ceil(clamped / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function settingsSummary(settings: ChessTimeSettings): string {
  if (settings.gameTimeMs === 0 && settings.incrementMs === 0) {
    return settings.moveTimeMs === 0
      ? 'Không giới hạn'
      : `Không giới hạn tổng giờ · ${settings.moveTimeMs >= 60_000 ? `${Math.round(settings.moveTimeMs / 60000)} phút / nước` : `${Math.round(settings.moveTimeMs / 1000)} giây / nước`}`;
  }
  const minutes = Math.round(settings.gameTimeMs / 60000);
  const increment = Math.round(settings.incrementMs / 1000);
  const control = `${minutes}+${increment}`;
  const move =
    settings.moveTimeMs === 0
      ? null
      : settings.moveTimeMs >= 60_000
        ? `${Math.round(settings.moveTimeMs / 60000)} phút / nước`
        : `${Math.round(settings.moveTimeMs / 1000)} giây / nước`;
  return move ? `${control} · ${move}` : control;
}

export function timeoutLabel(loser: 'w' | 'b'): string {
  return loser === 'w' ? 'Đen thắng — Trắng hết giờ' : 'Trắng thắng — Đen hết giờ';
}

export function timeoutReason(settings: ChessTimeSettings, remainingMoveMs: number): string {
  if (settings.moveTimeMs > 0 && remainingMoveMs <= 0) {
    return 'Hết thời gian cho nước đi hiện tại.';
  }
  return 'Hết tổng thời gian của ván.';
}
