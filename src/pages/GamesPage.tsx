import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { GameCard } from '@/components/ui/GameCard';
import { GAME_CATEGORIES, GAMES, type GameCategoryId } from '@/games/catalog';
import { cn } from '@/utils/cn';

const ALL = 'all';

export function GamesPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<typeof ALL | GameCategoryId>(ALL);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return GAMES.filter((game) => {
      const matchesCategory = category === ALL || game.categories.includes(category);
      const matchesQuery =
        !normalized ||
        game.name.toLowerCase().includes(normalized) ||
        game.description.toLowerCase().includes(normalized) ||
        game.tagline.toLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl">Trò chơi</h1>
        <p className="mt-2 text-stone-500">Lọc theo danh mục hoặc tìm tên trò chơi. Chỉ những game đã triển khai mới mở được.</p>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterChip active={category === ALL} onClick={() => setCategory(ALL)}>
            Tất cả
          </FilterChip>
          {(Object.keys(GAME_CATEGORIES) as GameCategoryId[]).map((id) => (
            <FilterChip key={id} active={category === id} onClick={() => setCategory(id)}>
              {GAME_CATEGORIES[id]}
            </FilterChip>
          ))}
        </div>
        <label className="block w-full md:max-w-xs">
          <span className="sr-only">Tìm trò chơi</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm cờ vua, ô ăn quan..."
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none ring-brand focus:ring-2 dark:border-stone-600 dark:bg-stone-900"
          />
        </label>
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Không tìm thấy trò chơi" message="Thử đổi từ khóa hoặc chọn danh mục khác." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {filtered.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition',
        active
          ? 'bg-brand text-white ring-brand'
          : 'bg-white text-stone-600 ring-stone-300 hover:bg-stone-50 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-600',
      )}
    >
      {children}
    </button>
  );
}
