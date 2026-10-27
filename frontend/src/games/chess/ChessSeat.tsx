import { PlayerAvatar } from '@/components/ranking/PlayerAvatar';
import { cn } from '@/utils/cn';

interface ChessSeatProps {
  name: string;
  avatarId: string;
  color: 'w' | 'b';
  active?: boolean;
  thinking?: boolean;
  size?: 'md' | 'lg';
}

export function ChessSeat({ name, avatarId, color, active, thinking, size = 'md' }: ChessSeatProps) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5">
      <span className={cn('relative inline-flex rounded-full', thinking && 'chess-seat-thinking')}>
        <PlayerAvatar
          avatarId={avatarId}
          name={name}
          size={size}
          className={cn(
            thinking
              ? 'ring-0'
              : active
                ? 'ring-brand'
                : color === 'w'
                  ? 'ring-stone-200 dark:ring-[#cbbda8]'
                  : 'ring-stone-700',
          )}
        />
      </span>
      <p className="max-w-[10rem] truncate text-center text-sm font-semibold leading-tight">{name}</p>
    </div>
  );
}
