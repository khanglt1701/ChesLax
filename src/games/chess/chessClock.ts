export interface ChessTimeSettings {
  gameTimeMs: number;
  moveTimeMs: number;
}

export interface ClockState {
  gameRemainingMs: { w: number; b: number };
  moveRemainingMs: number;
  timedOut: 'w' | 'b' | null;
}

export const DEFAULT_CHESS_SETTINGS: ChessTimeSettings = {
  gameTimeMs: 10 * 60 * 1000,
  moveTimeMs: 0,
};

export const GAME_TIME_PRESETS = [
  { id: 'off', label: 'Không giới hạn', ms: 0 },
  { id: '3m', label: '3 phút', ms: 3 * 60 * 1000 },
  { id: '5m', label: '5 phút', ms: 5 * 60 * 1000 },
  { id: '10m', label: '10 phút', ms: 10 * 60 * 1000 },
  { id: '15m', label: '15 phút', ms: 15 * 60 * 1000 },
  { id: '30m', label: '30 phút', ms: 30 * 60 * 1000 },
] as const;

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

export function afterMoveClock(state: ClockState, settings: ChessTimeSettings): ClockState {
  return {
    ...state,
    moveRemainingMs: settings.moveTimeMs,
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
  const game =
    settings.gameTimeMs === 0
      ? 'Không giới hạn tổng giờ'
      : `${Math.round(settings.gameTimeMs / 60000)} phút / bên`;
  const move =
    settings.moveTimeMs === 0
      ? 'không giới hạn mỗi nước'
      : settings.moveTimeMs >= 60_000
        ? `${Math.round(settings.moveTimeMs / 60000)} phút / nước`
        : `${Math.round(settings.moveTimeMs / 1000)} giây / nước`;
  return `${game} · ${move}`;
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
