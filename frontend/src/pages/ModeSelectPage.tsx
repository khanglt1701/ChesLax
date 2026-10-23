import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { getGameById } from '@/games/catalog';
import { useMyRatings } from '@/hooks/useMyRatings';
import { t } from '@/i18n/t';
import { formatRating } from '@/ranking/rankService';
import { isOnlineGameId } from '@/services/playService';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

export function ModeSelectPage() {
  const { gameId = 'chess' } = useParams();
  const game = getGameById(gameId);
  const auth = useAuthStore();
  const { ratings } = useMyRatings();
  const signedIn = auth.status === 'authenticated' && auth.user && !auth.user.isGuest;
  const liveGame = isOnlineGameId(gameId) ? gameId : 'chess';
  const elo = ratings[liveGame]?.rating ?? 1000;

  if (!game) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-3xl">{t('notFound.title')}</h1>
        <Link to="/games" className="text-sm font-medium text-brand hover:underline">
          {t('notFound.games')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/games" className="text-sm font-medium text-brand hover:underline">
          ← {t('nav.games')}
        </Link>
        <h1 className="mt-1 font-display text-4xl">{game.name}</h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">{t('play.modeSubtitle')}</p>
        <p className="mt-2 text-sm text-stone-500">
          {signedIn
            ? `${t('play.signedInAs')} ${auth.user?.displayName} · Elo ${formatRating(elo)}`
            : t('play.playingAsGuest')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ModeCard
          to={`/games/${liveGame}/casual`}
          title={t('play.casualTitle')}
          subtitle={t('play.casualTag')}
          body={t('play.casualBody')}
          action={t('play.casualAction')}
          accent="casual"
        />
        <ModeCard
          to={signedIn ? `/games/${liveGame}/ranked` : `/login`}
          title={t('play.rankedTitle')}
          subtitle={t('play.rankedTag')}
          body={signedIn ? t('play.rankedBody') : t('play.rankedGuestBody')}
          action={signedIn ? t('play.rankedAction') : t('nav.login')}
          accent="ranked"
          disabledReason={signedIn ? undefined : t('play.loginRequired')}
          state={!signedIn ? { from: `/games/${liveGame}/ranked` } : undefined}
        />
      </div>
    </div>
  );
}

function ModeCard({
  to,
  title,
  subtitle,
  body,
  action,
  accent,
  disabledReason,
  state,
}: {
  to: string;
  title: string;
  subtitle: string;
  body: string;
  action: string;
  accent: 'casual' | 'ranked';
  disabledReason?: string;
  state?: { from: string };
}) {
  return (
    <section
      className={cn(
        'flex h-full flex-col rounded-3xl bg-white p-5 ring-1 dark:bg-stone-900',
        accent === 'ranked' ? 'ring-brand/40' : 'ring-stone-200 dark:ring-stone-700',
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">{subtitle}</p>
      <h2 className="mt-2 font-display text-2xl">{title}</h2>
      <p className="mt-3 flex-1 text-sm leading-6 text-stone-600 dark:text-stone-300">{body}</p>
      {disabledReason ? <p className="mt-3 text-xs text-stone-500">{disabledReason}</p> : null}
      <Link to={to} state={state} className="mt-5 block">
        <Button className="w-full">{action}</Button>
      </Link>
    </section>
  );
}
