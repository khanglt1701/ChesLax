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

  if (gameId === 'co-tuong') {
    return (
      <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
        <rect width="320" height="180" className="fill-[#f3e0c0] dark:fill-amber-950" />
        <rect x="70" y="22" width="180" height="136" rx="8" className="fill-[#e7c796] dark:fill-amber-900" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <line key={`h-${i}`} x1="86" y1={34 + i * 14} x2="234" y2={34 + i * 14} className="stroke-[#7a4a28]" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <line key={`v-${i}`} x1={86 + i * 21.1} y1="34" x2={86 + i * 21.1} y2="146" className="stroke-[#7a4a28]" />
        ))}
        <circle cx="160" cy="146" r="9" className="fill-[#f6e7c8] stroke-[#9a2b1f]" />
        <circle cx="160" cy="34" r="9" className="fill-[#2b261f] stroke-[#d9cbb8]" />
      </svg>
    );
  }

  if (gameId === 'co-ganh') {
    return (
      <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
        <rect width="320" height="180" className="fill-[#e7f3ef] dark:fill-teal-950" />
        <rect x="86" y="28" width="148" height="124" rx="12" className="fill-[#f6efe3] dark:fill-stone-800" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line x1="104" y1={44 + i * 28} x2="216" y2={44 + i * 28} className="stroke-[#6b5340] dark:stroke-amber-200" />
            <line x1={104 + i * 28} y1="44" x2={104 + i * 28} y2="156" className="stroke-[#6b5340] dark:stroke-amber-200" />
          </g>
        ))}
        <line x1="104" y1="156" x2="216" y2="156" className="stroke-[#6b5340] dark:stroke-amber-200" />
        <line x1="216" y1="44" x2="216" y2="156" className="stroke-[#6b5340] dark:stroke-amber-200" />
        <line x1="104" y1="44" x2="160" y2="100" className="stroke-[#6b5340] dark:stroke-amber-200" />
        <line x1="216" y1="44" x2="160" y2="100" className="stroke-[#6b5340] dark:stroke-amber-200" />
        <circle cx="132" cy="128" r="7" className="fill-[#c2410c]" />
        <circle cx="188" cy="72" r="7" className="fill-[#0f766e]" />
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

  if (gameId === 'imposter') {
    return (
      <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
        <rect width="320" height="180" className="fill-[#efe7f8] dark:fill-violet-950" />
        <circle cx="118" cy="92" r="28" className="fill-white dark:fill-violet-900" />
        <circle cx="168" cy="78" r="24" className="fill-[#5b3a8c]" />
        <circle cx="206" cy="104" r="22" className="fill-[#0f766e]" />
        <circle cx="160" cy="48" r="6" className="fill-amber-300" />
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
