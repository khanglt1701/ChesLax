import { EmptyState } from '@/components/ui/EmptyState';
import { useStatsStore, type GameStats } from '@/store/statsStore';

function formatTime(value: number | null): string {
  if (!value) return 'Chưa chơi';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value);
}

export function StatsPage() {
  const chess = useStatsStore((state) => state.chess);
  const oAnQuan = useStatsStore((state) => state.oAnQuan);
  const caro = useStatsStore((state) => state.caro);
  const recent = useStatsStore((state) => state.recent);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl">Thống kê</h1>
        <p className="mt-2 text-stone-500">
          Số liệu được lưu trên thiết bị này qua LocalStorage, không cần đăng nhập.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <StatsCard title="Cờ vua" stats={chess} p1="Trắng thắng" p2="Đen thắng" />
        <StatsCard title="Caro" stats={caro} p1="X thắng" p2="O thắng" />
        <StatsCard title="Ô ăn quan" stats={oAnQuan} p1="Người chơi 1 thắng" p2="Người chơi 2 thắng" />
      </div>
      <section>
        <h2 className="font-display text-2xl">Lịch sử gần đây</h2>
        {recent.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="Chưa có ván nào" message="Hoàn thành một ván cờ vua, caro hoặc ô ăn quan để ghi nhận tại đây." />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-stone-200 overflow-hidden rounded-3xl bg-white ring-1 ring-stone-200 dark:divide-stone-700 dark:bg-stone-900 dark:ring-stone-700">
            {recent.map((item) => (
              <li key={`${item.at}-${item.result}`} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium">{item.gameName}</p>
                  <p className="text-sm text-stone-500">{item.result}</p>
                </div>
                <time className="text-xs text-stone-400">{formatTime(item.at)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatsCard({
  title,
  stats,
  p1,
  p2,
}: {
  title: string;
  stats: GameStats;
  p1: string;
  p2: string;
}) {
  return (
    <article className="rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
      <h2 className="font-display text-2xl">{title}</h2>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Stat label="Số ván" value={stats.played} />
        <Stat label="Hòa" value={stats.draws} />
        <Stat label={p1} value={stats.winsP1} />
        <Stat label={p2} value={stats.winsP2} />
      </dl>
      <p className="mt-4 text-xs text-stone-400">Lần chơi gần nhất: {formatTime(stats.lastPlayedAt)}</p>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-3 dark:bg-stone-800">
      <dt className="text-stone-500">{label}</dt>
      <dd className="mt-1 font-display text-2xl">{value}</dd>
    </div>
  );
}
