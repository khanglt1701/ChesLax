import {
  DAN_PER_PIT,
  DIRECTION,
  GAME_END_REASON,
  LEFT_QUAN_INDEX,
  PIT_COUNT,
  PLAYER,
  QUAN_VALUE,
  RESUPPLY_COST,
  RIGHT_QUAN_INDEX,
  type Direction,
  type MoveResult,
  type OAnQuanEvent,
  type OAnQuanState,
  type Pit,
  type PlayerId,
} from './oAnQuan.types';

function cloneState(state: OAnQuanState): OAnQuanState {
  return structuredClone(state);
}

function createPit(
  index: number,
  type: Pit['type'],
  dan: number,
  quan: number,
  owner: PlayerId | null,
): Pit {
  return { index, type, dan, quan, owner };
}

export function createInitialState(): OAnQuanState {
  const pits: Pit[] = [];
  for (let i = 0; i < 5; i += 1) {
    pits.push(createPit(i, 'dan', DAN_PER_PIT, 0, PLAYER.one));
  }
  pits.push(createPit(RIGHT_QUAN_INDEX, 'quan', 0, 1, null));
  for (let i = 6; i < 11; i += 1) {
    pits.push(createPit(i, 'dan', DAN_PER_PIT, 0, PLAYER.two));
  }
  pits.push(createPit(LEFT_QUAN_INDEX, 'quan', 0, 1, null));

  return {
    pits,
    currentPlayer: PLAYER.one,
    captured: [
      { dan: 0, quan: 0 },
      { dan: 0, quan: 0 },
    ],
    status: 'playing',
    winner: null,
    endReason: null,
    resupplied: false,
  };
}

export function nextIndex(index: number, direction: Direction): number {
  if (direction === DIRECTION.cw) return (index + 1) % PIT_COUNT;
  return (index + PIT_COUNT - 1) % PIT_COUNT;
}

export function isEmpty(pit: Pit): boolean {
  return pit.dan === 0 && pit.quan === 0;
}

export function playerDanPits(state: OAnQuanState, player: PlayerId): Pit[] {
  return state.pits.filter((pit) => pit.owner === player);
}

export function playerHasMove(state: OAnQuanState, player: PlayerId): boolean {
  return playerDanPits(state, player).some((pit) => pit.dan > 0);
}

export function getValidPits(state: OAnQuanState, player: PlayerId = state.currentPlayer): number[] {
  if (state.status !== 'playing') return [];
  return playerDanPits(state, player)
    .filter((pit) => pit.dan > 0)
    .map((pit) => pit.index);
}

export function isValidMove(state: OAnQuanState, pitIndex: number, player: PlayerId = state.currentPlayer): boolean {
  return getValidPits(state, player).includes(pitIndex);
}

export function scoreOf(captured: { dan: number; quan: number }): number {
  return captured.dan + captured.quan * QUAN_VALUE;
}

export function bothQuanPitsEmpty(state: OAnQuanState): boolean {
  return isEmpty(state.pits[LEFT_QUAN_INDEX]) && isEmpty(state.pits[RIGHT_QUAN_INDEX]);
}

function pitLabel(index: number): string {
  if (index === LEFT_QUAN_INDEX) return 'ô quan trái';
  if (index === RIGHT_QUAN_INDEX) return 'ô quan phải';
  if (index <= 4) return `ô ${index + 1} hàng dưới`;
  return `ô ${11 - index} hàng trên`;
}

function directionLabel(direction: Direction): string {
  return direction === DIRECTION.cw ? 'phải (theo chiều kim đồng hồ)' : 'trái (ngược chiều kim đồng hồ)';
}

function collectRemaining(state: OAnQuanState): void {
  for (const pit of state.pits) {
    if (pit.owner === null || pit.dan === 0) continue;
    state.captured[pit.owner].dan += pit.dan;
    pit.dan = 0;
  }
}

function decideWinner(state: OAnQuanState, reason: OAnQuanState['endReason']): void {
  state.status = 'ended';
  state.endReason = reason;
  if (reason === GAME_END_REASON.cannotResupply) {
    state.winner = state.currentPlayer === PLAYER.one ? PLAYER.two : PLAYER.one;
    return;
  }
  const s0 = scoreOf(state.captured[0]);
  const s1 = scoreOf(state.captured[1]);
  if (s0 > s1) state.winner = PLAYER.one;
  else if (s1 > s0) state.winner = PLAYER.two;
  else state.winner = 'draw';
}

function capturePit(state: OAnQuanState, pitIndex: number, events: OAnQuanEvent[]): void {
  const pit = state.pits[pitIndex];
  const dan = pit.dan;
  const quan = pit.quan;
  if (dan === 0 && quan === 0) return;
  state.captured[state.currentPlayer].dan += dan;
  state.captured[state.currentPlayer].quan += quan;
  pit.dan = 0;
  pit.quan = 0;
  events.push({ type: 'capture', pit: pitIndex, dan, quan });
}

/**
 * Tiếp quân: nếu hàng dân của người sắp đi trống, lấy 5 quân dân
 * từ số quân đã ăn (đổi 1 quan = 5 dân khi thiếu) rồi đặt 1 quân vào mỗi ô.
 * Không đủ quân thì thua cuộc.
 */
export function applyResupplyIfNeeded(state: OAnQuanState): { state: OAnQuanState; events: OAnQuanEvent[] } {
  const next = cloneState(state);
  const events: OAnQuanEvent[] = [];
  next.resupplied = false;

  if (next.status !== 'playing') return { state: next, events };
  if (playerHasMove(next, next.currentPlayer)) return { state: next, events };

  const captured = next.captured[next.currentPlayer];
  const available = scoreOf(captured);
  if (available < RESUPPLY_COST) {
    decideWinner(next, GAME_END_REASON.cannotResupply);
    events.push({
      type: 'gameEnd',
      winner: next.winner ?? 'draw',
      reason: GAME_END_REASON.cannotResupply,
    });
    return { state: next, events };
  }

  let need = RESUPPLY_COST;
  let convertedQuan = 0;
  const takeDan = Math.min(captured.dan, need);
  captured.dan -= takeDan;
  need -= takeDan;

  while (need > 0 && captured.quan > 0) {
    captured.quan -= 1;
    convertedQuan += 1;
    const converted = QUAN_VALUE;
    const used = Math.min(converted, need);
    need -= used;
    captured.dan += converted - used;
  }

  for (const pit of playerDanPits(next, next.currentPlayer)) {
    pit.dan += 1;
  }
  next.resupplied = true;
  events.push({ type: 'resupply', player: next.currentPlayer, convertedQuan });
  return { state: next, events };
}

export function applyMove(state: OAnQuanState, pitIndex: number, direction: Direction): MoveResult {
  if (state.status !== 'playing') {
    throw new Error('Ván đã kết thúc.');
  }
  if (!isValidMove(state, pitIndex)) {
    throw new Error('Ô không hợp lệ hoặc không thuộc lượt hiện tại.');
  }

  const next = cloneState(state);
  next.resupplied = false;
  const events: OAnQuanEvent[] = [];
  const pit = next.pits[pitIndex];
  let hand = pit.dan;
  pit.dan = 0;
  events.push({ type: 'pick', pit: pitIndex, dan: hand });

  let current = pitIndex;
  let capturedDan = 0;
  let capturedQuan = 0;

  while (hand > 0) {
    while (hand > 0) {
      current = nextIndex(current, direction);
      next.pits[current].dan += 1;
      hand -= 1;
      events.push({ type: 'drop', pit: current });
    }

    const n1 = nextIndex(current, direction);
    const n2 = nextIndex(n1, direction);
    const nextPit = next.pits[n1];

    if (nextPit.type === 'dan' && nextPit.dan > 0) {
      hand = nextPit.dan;
      nextPit.dan = 0;
      current = n1;
      events.push({ type: 'relay', pit: n1, dan: hand });
      continue;
    }

    if (nextPit.type === 'quan' && !isEmpty(nextPit)) {
      break;
    }

    if (isEmpty(nextPit) && !isEmpty(next.pits[n2])) {
      let emptyIndex = n1;
      let targetIndex = n2;
      while (isEmpty(next.pits[emptyIndex]) && !isEmpty(next.pits[targetIndex])) {
        capturedDan += next.pits[targetIndex].dan;
        capturedQuan += next.pits[targetIndex].quan;
        capturePit(next, targetIndex, events);
        emptyIndex = nextIndex(targetIndex, direction);
        targetIndex = nextIndex(emptyIndex, direction);
      }
    }
    break;
  }

  if (bothQuanPitsEmpty(next)) {
    collectRemaining(next);
    decideWinner(next, GAME_END_REASON.bothQuanEmpty);
    events.push({
      type: 'gameEnd',
      winner: next.winner ?? 'draw',
      reason: GAME_END_REASON.bothQuanEmpty,
    });
  } else {
    next.currentPlayer = next.currentPlayer === PLAYER.one ? PLAYER.two : PLAYER.one;
    events.push({ type: 'turnEnd', nextPlayer: next.currentPlayer });
    const resupply = applyResupplyIfNeeded(next);
    next.pits = resupply.state.pits;
    next.captured = resupply.state.captured;
    next.status = resupply.state.status;
    next.winner = resupply.state.winner;
    next.endReason = resupply.state.endReason;
    next.resupplied = resupply.state.resupplied;
    events.push(...resupply.events);
  }

  const description = [
    `Người chơi ${state.currentPlayer + 1} chọn ${pitLabel(pitIndex)}, rải ${directionLabel(direction)}`,
    capturedDan || capturedQuan
      ? `ăn ${capturedDan} dân${capturedQuan ? ` và ${capturedQuan} quan` : ''}`
      : null,
  ]
    .filter(Boolean)
    .join(', ');

  return { state: next, events, description };
}

export function applyMoveForPlayer(
  state: OAnQuanState,
  pitIndex: number,
  direction: Direction,
  playerId: PlayerId,
): MoveResult {
  if (state.currentPlayer !== playerId) {
    throw new Error('Không phải lượt của bạn.');
  }
  return applyMove(state, pitIndex, direction);
}

export function playerName(player: PlayerId): string {
  return player === PLAYER.one ? 'Người chơi 1' : 'Người chơi 2';
}

export function resultLabel(state: OAnQuanState): string {
  if (state.status !== 'ended') return 'Đang chơi';
  if (state.winner === 'draw') return 'Hòa';
  if (state.endReason === GAME_END_REASON.cannotResupply) {
    return `${playerName(state.winner as PlayerId)} thắng (đối phương không đủ quân để tiếp)`;
  }
  return `${playerName(state.winner as PlayerId)} thắng`;
}

export function screenDirectionToEngine(pitIndex: number, screen: 'left' | 'right'): Direction {
  const isTopRow = pitIndex >= 6 && pitIndex <= 10;
  if (isTopRow) {
    return screen === 'left' ? DIRECTION.cw : DIRECTION.ccw;
  }
  return screen === 'left' ? DIRECTION.ccw : DIRECTION.cw;
}
