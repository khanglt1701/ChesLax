interface ChessMoveListProps {
  moves: string[];
}

export function ChessMoveList({ moves }: ChessMoveListProps) {
  const rows = Math.ceil(moves.length / 2);

  return (
    <section className="rounded-2xl bg-white/80 p-4 ring-1 ring-stone-200 dark:bg-stone-900/70 dark:ring-stone-700">
      <h3 className="text-sm font-semibold">Lịch sử nước đi</h3>
      {moves.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">Chưa có nước đi nào.</p>
      ) : (
        <ol className="mt-3 max-h-52 space-y-1 overflow-y-auto font-mono text-sm">
          {Array.from({ length: rows }, (_, index) => {
            const white = moves[index * 2];
            const black = moves[index * 2 + 1];
            return (
              <li key={index} className="grid grid-cols-[2rem_1fr_1fr] gap-2 rounded-lg px-1 py-0.5 even:bg-black/5 dark:even:bg-white/5">
                <span className="text-stone-400">{index + 1}.</span>
                <span>{white}</span>
                <span className="text-stone-500">{black ?? ''}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
