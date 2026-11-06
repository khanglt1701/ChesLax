import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { BoardThemeSelector } from '@/games/chess/BoardThemeSelector';
import { PieceSetSelector } from '@/games/chess/PieceSetSelector';
import {
  loadChessAppearance,
  saveChessAppearance,
  type ChessAppearance,
} from '@/games/chess/chessAppearance';
import {
  OAQ_THEMES,
  loadOAnQuanTheme,
  saveOAnQuanTheme,
  type OAnQuanThemeId,
} from '@/games/o-an-quan/oAnQuanAppearance';
import { t } from '@/i18n/t';
import { usePlayerStore } from '@/store/playerStore';
import { useThemeStore, type Theme } from '@/store/themeStore';
import { cn } from '@/utils/cn';

export function SettingsPage() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const players = usePlayerStore((state) => state.players);
  const setPlayer = usePlayerStore((state) => state.setPlayer);
  const [chess, setChess] = useState<ChessAppearance>(loadChessAppearance);
  const [oaqTheme, setOaqTheme] = useState<OAnQuanThemeId>(loadOAnQuanTheme);

  function persist(nextTheme: Theme, nextChess: ChessAppearance, nextOaq: OAnQuanThemeId) {
    setTheme(nextTheme);
    setChess(nextChess);
    saveChessAppearance(nextChess);
    setOaqTheme(nextOaq);
    saveOAnQuanTheme(nextOaq);
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
        <h2 className="font-display text-2xl">{t('settings.players')}</h2>
        <p className="text-sm text-stone-500">{t('settings.playersHint')}</p>
        <label className="block text-sm font-medium">
          {t('settings.player1')}
          <input
            value={players.player1}
            maxLength={24}
            onChange={(event) => setPlayer('player1', event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-normal outline-none ring-brand focus:ring-2 dark:border-stone-600 dark:bg-stone-950"
          />
        </label>
        <label className="block text-sm font-medium">
          {t('settings.player2')}
          <input
            value={players.player2}
            maxLength={24}
            onChange={(event) => setPlayer('player2', event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-normal outline-none ring-brand focus:ring-2 dark:border-stone-600 dark:bg-stone-950"
          />
        </label>
      </section>

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
    </div>
  );
}
