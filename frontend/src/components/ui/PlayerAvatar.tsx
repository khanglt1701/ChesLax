import { useId } from 'react';
import { cn } from '@/utils/cn';

const PALETTES: Record<string, [string, string]> = {
  'seal-1': ['#0f766e', '#99f6e4'],
  'seal-2': ['#1d4ed8', '#bfdbfe'],
  'seal-3': ['#b45309', '#fde68a'],
  'seal-4': ['#7c3aed', '#ddd6fe'],
  'seal-5': ['#be123c', '#fecdd3'],
  'seal-6': ['#0e7490', '#a5f3fc'],
  'seal-7': ['#3f6212', '#d9f99d'],
  'seal-8': ['#9f1239', '#fda4af'],
};

interface PlayerAvatarProps {
  avatarId: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-20 w-20',
};

export function PlayerAvatar({ avatarId, name, size = 'md', className }: PlayerAvatarProps) {
  const [a, b] = PALETTES[avatarId] ?? PALETTES['seal-1']!;
  const initial = name.trim().charAt(0).toUpperCase() || 'C';
  const gradientId = useId().replace(/:/g, '');

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center overflow-hidden rounded-full ring-2 ring-white dark:ring-stone-800',
        SIZE[size],
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" className="h-full w-full">
        <defs>
          <linearGradient id={gradientId} x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor={b} />
            <stop offset="1" stopColor={a} />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="24" fill={`url(#${gradientId})`} />
        <path d="M24 8l4 8 9 1-7 6 2 9-8-4-8 4 2-9-7-6 9-1 4-8z" fill="rgba(255,255,255,0.22)" />
        <text
          x="24"
          y="30"
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill="#f8f4ea"
          fontFamily="Fraunces, Georgia, serif"
        >
          {initial}
        </text>
      </svg>
    </span>
  );
}
