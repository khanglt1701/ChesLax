import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-dark disabled:bg-stone-300 dark:disabled:bg-stone-700',
  secondary:
    'bg-white text-ink ring-1 ring-stone-300 hover:bg-stone-50 dark:bg-stone-800 dark:text-paper dark:ring-stone-600 dark:hover:bg-stone-700',
  ghost: 'text-ink hover:bg-black/5 dark:text-paper dark:hover:bg-white/10',
  danger: 'bg-accent text-white hover:bg-orange-800',
};

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
