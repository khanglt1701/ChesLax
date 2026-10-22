import type { OAnQuanEvent, OAnQuanState } from './oAnQuan.types';

export function applyVisualEvent(state: OAnQuanState, event: OAnQuanEvent): OAnQuanState {
  const next = structuredClone(state);
  switch (event.type) {
    case 'pick':
    case 'relay':
      next.pits[event.pit].dan = 0;
      break;
    case 'drop':
      next.pits[event.pit].dan += 1;
      break;
    case 'capture':
      next.captured[next.currentPlayer].dan += next.pits[event.pit].dan;
      next.captured[next.currentPlayer].quan += next.pits[event.pit].quan;
      next.pits[event.pit].dan = 0;
      next.pits[event.pit].quan = 0;
      break;
    case 'resupply':
      next.currentPlayer = event.player;
      for (const pit of next.pits) {
        if (pit.owner === event.player) pit.dan += 1;
      }
      break;
    case 'turnEnd':
      next.currentPlayer = event.nextPlayer;
      break;
    case 'gameEnd':
      next.status = 'ended';
      next.winner = event.winner;
      break;
    default:
      break;
  }
  return next;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function eventDelay(event: OAnQuanEvent): number {
  if (event.type === 'drop') return 140;
  if (event.type === 'capture' || event.type === 'relay') return 220;
  return 80;
}
