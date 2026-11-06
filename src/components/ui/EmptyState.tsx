interface EmptyStateProps {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 px-6 py-10 text-center dark:border-stone-600">
      <h3 className="font-display text-xl text-ink dark:text-paper">{title}</h3>
      <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{message}</p>
    </div>
  );
}
