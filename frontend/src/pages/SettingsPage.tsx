import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { BoardThemeSelector } from '@/games/chess/BoardThemeSelector';
import { PieceSetSelector } from '@/games/chess/PieceSetSelector';
import {
  loadChessAppearance,
  parseChessAppearance,
  saveChessAppearance,
  type ChessAppearance,
} from '@/games/chess/chessAppearance';
import {
  OAQ_THEMES,
  loadOAnQuanTheme,
  parseOAnQuanTheme,
  saveOAnQuanTheme,
  type OAnQuanThemeId,
} from '@/games/o-an-quan/oAnQuanAppearance';
import { t } from '@/i18n/t';
import { isSuperAdmin } from '@/services/authService';
import { getMyPreferences, updateMyPreferences } from '@/services/preferenceService';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, type Theme } from '@/store/themeStore';
import { cn } from '@/utils/cn';
import { useEffect, useState } from 'react';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const auth = useAuthStore();
  const signedIn = auth.status === 'authenticated';
  const [chess, setChess] = useState<ChessAppearance>(loadChessAppearance);
  const [oaqTheme, setOaqTheme] = useState<OAnQuanThemeId>(loadOAnQuanTheme);

  const prefsQuery = useQuery({
    queryKey: ['preferences', 'me'],
    queryFn: getMyPreferences,
    enabled: signedIn,
  });

  useEffect(() => {
    const prefs = prefsQuery.data;
    if (!prefs) return;
    setChess(
      parseChessAppearance({
        boardTheme: prefs.chessBoardTheme,
        pieceSet: prefs.chessPieceSet,
      }),
    );
    setOaqTheme(parseOAnQuanTheme(prefs.oAnQuanTheme));
  }, [prefsQuery.data]);

  const savePrefs = useMutation({
    mutationFn: updateMyPreferences,
    onSuccess: (prefs) => {
      queryClient.setQueryData(['preferences', 'me'], prefs);
    },
  });

  function persist(nextTheme: Theme, nextChess: ChessAppearance, nextOaq: OAnQuanThemeId) {
    setTheme(nextTheme);
    setChess(nextChess);
    saveChessAppearance(nextChess);
    setOaqTheme(nextOaq);
    saveOAnQuanTheme(nextOaq);
    if (signedIn) {
      savePrefs.mutate({
        theme: nextTheme,
        chessBoardTheme: nextChess.boardTheme,
        chessPieceSet: nextChess.pieceSet,
        oAnQuanTheme: nextOaq,
      });
    }
  }

  function updateChess(next: ChessAppearance) {
    persist(theme, next, oaqTheme);
  }

  function updateOaq(next: OAnQuanThemeId) {
    persist(theme, chess, next);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-4xl">{t('settings.title')}</h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">{t('settings.subtitle')}</p>
      </div>

      <section className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        <h2 className="font-display text-2xl">{t('settings.appearance')}</h2>
        <div className="flex gap-2">
          <Button variant={theme === 'light' ? 'primary' : 'secondary'} onClick={() => persist('light', chess, oaqTheme)}>
            {t('settings.light')}
          </Button>
          <Button variant={theme === 'dark' ? 'primary' : 'secondary'} onClick={() => persist('dark', chess, oaqTheme)}>
            {t('settings.dark')}
          </Button>
        </div>
        <p className="text-sm text-stone-500">
          {t('settings.language')}: {t('settings.languageVi')}. {t('settings.languageEnSoon')}
        </p>
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        <h2 className="font-display text-2xl">{t('settings.chessBoard')}</h2>
        <BoardThemeSelector
          value={chess.boardTheme}
          onChange={(boardTheme) => updateChess({ ...chess, boardTheme })}
        />
        <h3 className="pt-2 text-sm font-semibold">{t('settings.chessPieces')}</h3>
        <PieceSetSelector value={chess.pieceSet} onChange={(pieceSet) => updateChess({ ...chess, pieceSet })} />
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        <h2 className="font-display text-2xl">{t('settings.oAnQuanBoard')}</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {OAQ_THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updateOaq(item.id)}
              className={cn(
                'rounded-2xl p-3 text-left ring-1 transition',
                oaqTheme === item.id ? 'ring-2 ring-brand' : 'ring-stone-300 dark:ring-stone-600',
              )}
            >
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className="mt-1 block text-xs text-stone-500">{item.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        <h2 className="font-display text-2xl">{t('settings.account')}</h2>
        {auth.status === 'authenticated' && auth.user ? (
          <p className="text-sm text-stone-600 dark:text-stone-300">
            {t('settings.accountSignedIn')} <strong>{auth.user.username}</strong>
          </p>
        ) : (
          <p className="text-sm text-stone-500">{t('settings.accountGuest')}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {isSuperAdmin(auth.user) ? (
            <Link
              to="/admin"
              className="inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
            >
              {t('settings.openAdmin')}
            </Link>
          ) : null}
          {auth.status === 'authenticated' ? (
            <Button variant="secondary" onClick={() => void auth.logout()}>
              {t('nav.logout')}
            </Button>
          ) : (
            <>
              <Link to="/login" className="inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-medium ring-1 ring-stone-300 dark:bg-stone-800 dark:ring-stone-600"
              >
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
