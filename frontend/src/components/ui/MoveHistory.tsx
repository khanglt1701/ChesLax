interface MoveHistoryProps {
  title?: string;
  moves: string[];
}

export function MoveHistory({ title = 'Lịch sử nước đi', moves }: MoveHistoryProps) {
  return (
    <section className="rounded-2xl bg-white/80 p-4 ring-1 ring-stone-200 dark:bg-stone-900/70 dark:ring-stone-700">
      <h3 className="text-sm font-semibold text-ink dark:text-paper">{title}</h3>
      {moves.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">Chưa có nước đi nào.</p>
      ) : (
        <ol className="mt-3 max-h-56 space-y-1.5 overflow-y-auto text-sm">
          {moves.map((move, index) => (
            <li key={`${move}-${index}`} className="flex gap-2 text-stone-600 dark:text-stone-300">
              <span className="w-6 shrink-0 text-stone-400">{index + 1}.</span>
              <span>{move}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
