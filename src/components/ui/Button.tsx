import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-dark disabled:bg-stone-300 disabled:text-stone-600 dark:disabled:bg-[#3a342e] dark:disabled:text-[#b3a89b]',
  secondary:
    'bg-white text-ink ring-1 ring-stone-300 hover:bg-stone-50 disabled:bg-stone-100 disabled:text-stone-500 disabled:ring-stone-200 dark:bg-[#2c261f] dark:text-[#f3ece3] dark:ring-[#5c5348] dark:hover:bg-[#3a322a] dark:disabled:bg-[#241f1b] dark:disabled:text-[#9c9083] dark:disabled:ring-[#4a433c]',
  ghost:
    'text-ink hover:bg-black/5 disabled:text-stone-400 dark:text-[#f3ece3] dark:hover:bg-white/10 dark:disabled:text-[#8f8478]',
  danger: 'bg-accent text-white hover:bg-orange-800 disabled:bg-orange-300',
};

const sizes: Record<Size, string> = {
  md: 'px-4 py-2.5',
  icon: 'h-11 w-11 px-0 py-0',
};

export function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
