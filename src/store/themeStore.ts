import { create } from 'zustand';
import { readStorage, writeStorage } from '@/utils/storage';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'cheslax.theme';

function getPreferredTheme(): Theme {
  const saved = readStorage<Theme | null>(THEME_KEY, null);
  if (saved === 'light' || saved === 'dark') return saved;
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  setTheme: (theme) => {
    writeStorage(THEME_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));

export function initTheme(): void {
  const theme = getPreferredTheme();
  applyTheme(theme);
  useThemeStore.setState({ theme });
}
