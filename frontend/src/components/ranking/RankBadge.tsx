import { useId } from 'react';
import { RANKS, type RankDefinition, type RankId } from '@/ranking/rankConfig';
import { cn } from '@/utils/cn';

type BadgeSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE: Record<BadgeSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-11 w-11',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

interface RankBadgeProps {
  rank: RankDefinition | RankId;
  size?: BadgeSize;
  showName?: boolean;
  showLevel?: boolean;
  className?: string;
}

export function RankBadge({ rank, size = 'md', showName = false, showLevel = false, className }: RankBadgeProps) {
  const definition = typeof rank === 'string' ? RANKS.find((item) => item.id === rank) : rank;
  if (!definition) return null;
  const legendary = definition.id === 'ky-thanh';

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn('relative inline-flex shrink-0', SIZE[size], legendary && 'rank-badge-legend')}
        title={definition.name}
      >
        <RankEmblem rank={definition} />
      </span>
      {showName || showLevel ? (
        <span className="min-w-0">
          {showName ? (
            <span className="block truncate font-semibold" style={{ color: definition.color }}>
              {definition.name}
            </span>
          ) : null}
          {showLevel ? (
            <span className="block text-[11px] uppercase tracking-wider text-stone-500">Cấp {definition.level}</span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

function RankEmblem({ rank }: { rank: RankDefinition }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-sm" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-fill`} x1="18" y1="6" x2="50" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor={rank.accent} />
          <stop offset="1" stopColor={rank.color} />
        </linearGradient>
      </defs>
      <path
        d="M32 4l18 7v16c0 14-8 24-18 29C22 51 14 41 14 27V11l18-7z"
        fill={`url(#${id}-fill)`}
        stroke="#1f1b16"
        strokeWidth="1.6"
      />
      <path d="M32 8l14 5.4V27c0 11.5-6.4 20-14 24.2C24.4 47 18 38.5 18 27V13.4L32 8z" fill="rgba(255,255,255,0.16)" />
      <g transform="translate(20 18) scale(0.53)" fill="#f8f4ea" stroke="#1f1b16" strokeWidth="2.2">
        <EmblemPath emblem={rank.emblem} legendary={rank.id === 'ky-thanh'} />
      </g>
    </svg>
  );
}

function EmblemPath({ emblem, legendary }: { emblem: RankDefinition['emblem']; legendary: boolean }) {
  if (emblem === 'pawn') {
    return <path d="M22 8a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm-9 28h18l-2-8H15l-2 8zm4-10h10c3 0 5-4 1-7H16c-4 3-2 7 1 7z" />;
  }
  if (emblem === 'knight') {
    return <path d="M10 36h24v-4L26 24s6-2 6-9c0-4-4-7-9-7-2 0-6 2-8 6l-3 2 3 4c2-1 4-1 5 1 1 2-1 5-5 6l-5 9z" />;
  }
  if (emblem === 'bishop') {
    return (
      <path d="M22 6c4 6 8 10 8 16 0 5-3 8-8 10-5-2-8-5-8-10 0-6 4-10 8-16zm-9 30h18l-3-8H16l-3 8zm7-12c6 0 8-6 2-9h-8c-6 3-4 9 2 9z" />
    );
  }
  if (emblem === 'rook') {
    return <path d="M10 36h24v-4H10v4zm3-7h18V16H13v13zm-1-15h4V8h4v6h4V8h4v6h4v6H12V14z" />;
  }
  if (emblem === 'queen') {
    return (
      <path d="M8 34h28l-2-10-6 7-6-14-6 14-6-7-2 10zm6-18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm8-3a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm8 3a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
    );
  }
  if (emblem === 'king') {
    return (
      <path d="M20 6v6M17 9h6M10 36h24c-4-4-6-8-6-14 0-5 2-8 4-12h-8c-2 4 0 7 0 12 0 6-2 10-6 14h-8z" />
    );
  }
  if (emblem === 'crown') {
    return <path d="M6 28h32l-3 8H9l-3-8zm4-4 6-12 6 9 6-9 6 12H10z" />;
  }
  return (
    <g>
      <path d="M22 4l3 7h8l-6 5 2 8-7-4-7 4 2-8-6-5h8l3-7z" />
      {legendary ? <path d="M22 22c8 0 12 6 12 12H10c0-6 4-12 12-12z" fill="rgba(255,255,255,0.35)" /> : null}
    </g>
  );
}
