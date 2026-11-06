import { useEffect, useState } from 'react';
import { ensurePlayer, isFirebaseConfigured } from '@/services/firebase/firebaseConfig';
import { subscribeLink, type LinkStatus } from '@/services/firebase/connectionService';
import { bindPresence, subscribeRoom, type LiveRoom } from '@/services/firebase/roomService';

export function useOnlineRoom(code: string) {
  const [room, setRoom] = useState<LiveRoom | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [link, setLink] = useState<LinkStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const member = Boolean(uid && room?.players[uid]);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setError('Chưa có cấu hình Firebase.');
      setReady(true);
      return;
    }
    let unsubscribeRoom = () => {};
    let unsubscribeLink = () => {};
    let cancelled = false;
    void (async () => {
      try {
        const playerId = await ensurePlayer();
        if (cancelled) return;
        setUid(playerId);
        unsubscribeLink = subscribeLink(setLink);
        unsubscribeRoom = subscribeRoom(code, setRoom, setError);
        setReady(true);
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Không mở được phòng.');
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
      unsubscribeRoom();
      unsubscribeLink();
    };
  }, [code]);

  useEffect(() => {
    if (!member || !uid) return;
    let stop = () => {};
    let cancelled = false;
    void bindPresence(code, uid).then((unsubscribe) => {
      if (cancelled) unsubscribe();
      else stop = unsubscribe;
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [code, member, uid]);

  return { room, uid, link, error, setError, ready, configured: isFirebaseConfigured() };
}
