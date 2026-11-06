import { useThemeStore } from '@/store/themeStore';

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-stone-300 transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:ring-[#5c5348] dark:hover:bg-white/10"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v1.6M12 19.4V21M5.2 5.2l1.1 1.1M17.7 17.7l1.1 1.1M3 12h1.6M19.4 12H21M5.2 18.8l1.1-1.1M17.7 6.3l1.1-1.1" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z" />
        </svg>
      )}
    </button>
  );
}
