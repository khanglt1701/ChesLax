import type { GameInfo } from '@/games/catalog';

export function GameArt({ gameId }: { gameId: GameInfo['id'] }) {
  if (gameId === 'chess') {
    return (
      <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
        <rect width="320" height="180" className="fill-[#d7ece7] dark:fill-teal-950" />
        <rect x="86" y="28" width="148" height="124" rx="10" className="fill-[#f3e6c9]" />
        {Array.from({ length: 8 }, (_, row) =>
          Array.from({ length: 8 }, (_, col) => {
            const dark = (row + col) % 2 === 1;
            return (
              <rect
                key={`${row}-${col}`}
                x={94 + col * 16.5}
                y={36 + row * 13.5}
                width="16.5"
                height="13.5"
                className={dark ? 'fill-[#5f8a7b]' : 'fill-[#f7f1e1]'}
              />
            );
          }),
        )}
        <circle cx="127" cy="76" r="7" className="fill-stone-800" />
        <circle cx="210" cy="118" r="7" className="fill-stone-100 stroke-stone-500" />
      </svg>
    );
  }

  if (gameId === 'o-an-quan') {
    return (
      <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
        <rect width="320" height="180" className="fill-[#f3e0c8] dark:fill-amber-950" />
        <rect x="36" y="42" width="248" height="96" rx="48" className="fill-[#a47148]" />
        <ellipse cx="64" cy="90" rx="22" ry="34" className="fill-[#7c4a28]" />
        <ellipse cx="256" cy="90" rx="22" ry="34" className="fill-[#7c4a28]" />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <circle cx={108 + i * 26} cy="72" r="11" className="fill-[#d7b48a]" />
            <circle cx={108 + i * 26} cy="108" r="11" className="fill-[#d7b48a]" />
          </g>
        ))}
        <circle cx="64" cy="90" r="7" className="fill-amber-200" />
        <circle cx="256" cy="90" r="7" className="fill-amber-200" />
      </svg>
    );
  }

  if (gameId === 'caro') {
    return (
      <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
        <rect width="320" height="180" className="fill-[#e7eef6] dark:fill-slate-900" />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line x1="70" y1={40 + i * 25} x2="250" y2={40 + i * 25} className="stroke-slate-400" />
            <line x1={90 + i * 40} y1="30" x2={90 + i * 40} y2="150" className="stroke-slate-400" />
          </g>
        ))}
        <circle cx="130" cy="90" r="10" className="stroke-brand fill-none" strokeWidth="3" />
        <path d="M170 78l22 22M192 78l-22 22" className="stroke-accent" strokeWidth="3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
      <rect width="320" height="180" className="fill-[#ece7f8] dark:fill-indigo-950" />
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={98 + col * 42}
            y={36 + row * 38}
            width="36"
            height="32"
            rx="4"
            className="fill-white stroke-indigo-300 dark:fill-indigo-900"
          />
        )),
      )}
    </svg>
  );
}
