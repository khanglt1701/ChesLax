import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ConnectionStatus } from '@/components/online/ConnectionStatus';
import { Button } from '@/components/ui/Button';
import { getGameById } from '@/games/catalog';
import { useMyRatings } from '@/hooks/useMyRatings';
import { t } from '@/i18n/t';
import { onlineGameService } from '@/online/onlineGameService';
import { useOnlineGame } from '@/online/useOnlineGame';
import { formatRating } from '@/ranking/rankService';
import { ApiError } from '@/services/apiClient';
import { isOnlineGameId } from '@/services/playService';
import { useAuthStore } from '@/store/authStore';

export function RankedQueuePage() {
  const { gameId = 'chess' } = useParams();
  const navigate = useNavigate();
  const game = getGameById(gameId);
  const liveGame = isOnlineGameId(gameId) ? gameId : 'chess';
  const auth = useAuthStore();
  const { player, ratings } = useMyRatings();
  const { connection, queue, lastError } = useOnlineGame();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signedIn = auth.status === 'authenticated' && auth.user && !auth.user.isGuest;
  const elo = ratings[liveGame]?.rating ?? 1000;

  useEffect(() => {
    if (auth.status === 'unknown') return;
    if (!signedIn) {
      navigate('/login', { replace: true, state: { from: `/games/${liveGame}/ranked` } });
    }
  }, [auth.status, liveGame, navigate, signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    void (async () => {
      setBusy(true);
      try {
        await onlineGameService.connect({ name: player.name, avatarId: player.avatarId }, { guest: false });
        let status;
        try {
          status = await onlineGameService.enqueueRanked(liveGame);
        } catch (cause) {
          if (cause instanceof ApiError && cause.status === 409) {
            status = await onlineGameService.refreshQueue();
          } else {
            throw cause;
          }
        }
        if (!cancelled && status?.status === 'matched' && status.match?.roomCode) {
          navigate(`/play/${status.match.gameId}/${status.match.roomCode}`, { replace: true });
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof ApiError ? cause.message : t('play.queueError'));
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [liveGame, navigate, player.avatarId, player.name, signedIn]);

  useEffect(() => {
    if (queue?.status === 'matched' && queue.match?.roomCode) {
      navigate(`/play/${queue.match.gameId}/${queue.match.roomCode}`, { replace: true });
    }
  }, [navigate, queue]);

  useEffect(() => {
    if (!signedIn) return;
    const timer = window.setInterval(() => {
      void onlineGameService.refreshQueue().catch(() => undefined);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [signedIn]);

  async function cancel() {
    setBusy(true);
    try {
      await onlineGameService.cancelQueue();
      navigate(`/games/${liveGame}/online`, { replace: true });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : t('play.queueError'));
    } finally {
      setBusy(false);
    }
  }

  async function retry() {
    setError(null);
    setBusy(true);
    try {
      const status = await onlineGameService.enqueueRanked(liveGame);
      if (status.status === 'matched' && status.match?.roomCode) {
        navigate(`/play/${status.match.gameId}/${status.match.roomCode}`, { replace: true });
      }
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : t('play.queueError'));
    } finally {
      setBusy(false);
    }
  }

  if (!game) return null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link to={`/games/${liveGame}/online`} className="text-sm font-medium text-brand hover:underline">
            ← {t('play.modeTitle')}
          </Link>
          <h1 className="mt-1 font-display text-4xl">{t('play.searching')}</h1>
          <p className="mt-2 text-sm text-stone-500">
            {game.name} · Elo {formatRating(queue?.rating ?? elo)} · {t('play.rankedTag')}
          </p>
        </div>
        <ConnectionStatus status={connection} />
      </div>

      <section className="rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        <p className="font-display text-2xl tabular-nums">{queue?.waitedSeconds ?? 0}s</p>
        <p className="mt-2 text-sm text-stone-500">
          {t('play.currentRange')}: ±{queue?.allowedSpread ?? 100}
        </p>
        <p className="mt-4 text-sm leading-6 text-stone-600 dark:text-stone-300">{t('play.searchingHint')}</p>
        {error || lastError ? (
          <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
            {error ?? lastError}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" disabled={busy} onClick={() => void cancel()}>
            {t('play.cancel')}
          </Button>
          {error ? (
            <Button disabled={busy} onClick={() => void retry()}>
              {t('play.retry')}
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
