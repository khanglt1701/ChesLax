import { Link } from 'react-router-dom';
import { GameArt } from '@/components/games/GameArt';
import { GAME_CATEGORIES, GAME_STATUS, type GameInfo } from '@/games/catalog';
import { Button } from './Button';

interface GameCardProps {
  game: GameInfo;
}

export function GameCard({ game }: GameCardProps) {
  const path = game.path;
  const available = game.status === GAME_STATUS.available && path !== null;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
      <div className="relative h-40 overflow-hidden">
        <GameArt gameId={game.id} />
        {game.status === GAME_STATUS.comingSoon ? (
          <span className="absolute right-3 top-3 rounded-full bg-stone-900/80 px-3 py-1 text-xs font-medium text-white">
            Đang phát triển
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-2">
          {game.categories.map((category) => (
            <span
              key={category}
              className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-stone-600 dark:bg-stone-800 dark:text-stone-300"
            >
              {GAME_CATEGORIES[category]}
            </span>
          ))}
        </div>
        <h3 className="mt-3 font-display text-2xl text-ink dark:text-paper">{game.name}</h3>
        <p className="mt-1 text-sm text-stone-500">{game.tagline}</p>
        <p className="mt-3 flex-1 text-sm leading-6 text-stone-600 dark:text-stone-300">{game.description}</p>
        <p className="mt-3 text-xs font-medium text-stone-500">{game.players}</p>
        <div className="mt-4">
          {available && path ? (
            <Link
              to={path}
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark"
            >
              Chơi ngay
            </Link>
          ) : (
            <Button className="w-full" disabled>
              Chưa mở
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
