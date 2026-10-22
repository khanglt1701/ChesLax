import { useSyncExternalStore } from 'react';
import { onlineGameService, type OnlineSnapshot } from './onlineGameService';

export function useOnlineGame(): OnlineSnapshot {
  return useSyncExternalStore(
    (listener) => onlineGameService.subscribe(listener),
    () => onlineGameService.snapshot(),
    () => onlineGameService.snapshot(),
  );
}
