import { cn } from '@/utils/cn';

interface LogoProps {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
}

export function Logo({ className, markClassName, showWordmark = true }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg
        viewBox="0 0 64 64"
        className={cn('h-9 w-9 shrink-0', markClassName)}
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="16" className="fill-brand dark:fill-teal-400" />
        <path
          d="M32 10c-2.4 4.2-6.8 7-12 7 1.8 4.8 6.4 8.2 12 8.2S42.2 21.8 44 17c-5.2 0-9.6-2.8-12-7Z"
          className="fill-paper"
        />
        <path d="M20 28h24v4.5c0 2-1.2 3.5-3 3.5H23c-1.8 0-3-1.5-3-3.5V28Z" className="fill-paper" />
        <path d="M24 38h16l2 12H22l2-12Z" className="fill-paper" />
        <rect x="18" y="50" width="28" height="5" rx="1.5" className="fill-paper" />
      </svg>
      {showWordmark ? (
        <span className="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">
          Cheslax
        </span>
      ) : null}
    </span>
  );
}
