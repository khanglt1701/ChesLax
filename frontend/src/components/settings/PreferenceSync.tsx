import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parseChessAppearance, saveChessAppearance } from '@/games/chess/chessAppearance';
import { parseOAnQuanTheme, saveOAnQuanTheme } from '@/games/o-an-quan/oAnQuanAppearance';
import { getMyPreferences } from '@/services/preferenceService';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

export function PreferenceSync() {
  const auth = useAuthStore();
  const setTheme = useThemeStore((state) => state.setTheme);
  const query = useQuery({
    queryKey: ['preferences', 'me'],
    queryFn: getMyPreferences,
    enabled: auth.status === 'authenticated',
  });

  useEffect(() => {
    const prefs = query.data;
    if (!prefs) return;
    setTheme(prefs.theme);
    saveChessAppearance(
      parseChessAppearance({
        boardTheme: prefs.chessBoardTheme,
        pieceSet: prefs.chessPieceSet,
      }),
    );
    saveOAnQuanTheme(parseOAnQuanTheme(prefs.oAnQuanTheme));
  }, [query.data, setTheme]);

  return null;
}
