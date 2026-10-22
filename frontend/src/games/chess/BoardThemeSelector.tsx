import { cn } from '@/utils/cn';
import { BOARD_THEMES, type BoardThemeId } from './chessAppearance';

interface BoardThemeSelectorProps {
  value: BoardThemeId;
  onChange: (theme: BoardThemeId) => void;
}

export function BoardThemeSelector({ value, onChange }: BoardThemeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {BOARD_THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          onClick={() => onChange(theme.id)}
          className={cn(
            'rounded-2xl p-2 text-left ring-1 transition',
            value === theme.id
              ? 'ring-2 ring-brand'
              : 'ring-stone-300 hover:bg-stone-50 dark:ring-stone-600 dark:hover:bg-stone-800',
          )}
        >
          <span className={cn('mb-2 flex h-10 overflow-hidden rounded-lg', `theme-${theme.id}`)}>
            <span className="sq-light h-full w-1/2" />
            <span className="sq-dark h-full w-1/2" />
          </span>
          <span className="block text-xs font-semibold">{theme.label}</span>
        </button>
      ))}
    </div>
  );
}
