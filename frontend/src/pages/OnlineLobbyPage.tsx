import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ConnectionStatus } from '@/components/online/ConnectionStatus';
import { Button } from '@/components/ui/Button';
import { onlineGameService } from '@/online/onlineGameService';
import type { ColorPref, OnlineGameId, TimeControlId } from '@/online/protocol';
import { useOnlineGame } from '@/online/useOnlineGame';
import { useRatingStore } from '@/ranking/ratingStore';
import { cn } from '@/utils/cn';

export function OnlineLobbyPage() {
  const navigate = useNavigate();
  const player = useRatingStore((state) => state.player);
  const { connection, lastError } = useOnlineGame();
  const [game, setGame] = useState<OnlineGameId>('chess');
  const [colorPref, setColorPref] = useState<ColorPref>('random');
  const [timeControl, setTimeControl] = useState<TimeControlId>('off');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void onlineGameService.connect({ name: player.name, avatarId: player.avatarId });
  }, [player.avatarId, player.name]);

  async function createRoom() {
    setBusy(true);
    try {
      await onlineGameService.connect({ name: player.name, avatarId: player.avatarId });
      const result = await onlineGameService.createRoom({
        game,
        colorPref: game === 'chess' ? colorPref : undefined,
        timeControl: game === 'chess' ? timeControl : 'off',
      });
      if (result.ok && result.room) navigate(`/play/${result.room.game}/${result.room.code}`);
    } catch (error) {
      onlineGameService.lastError = error instanceof Error ? error.message : 'Không tạo được phòng.';
    } finally {
      setBusy(false);
    }
  }

  async function joinRoom() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setBusy(true);
    try {
      await onlineGameService.connect({ name: player.name, avatarId: player.avatarId });
      const result = await onlineGameService.joinRoom(code);
      if (result.ok && result.room) navigate(`/play/${result.room.game}/${result.room.code}`);
    } catch (error) {
      onlineGameService.lastError = error instanceof Error ? error.message : 'Không vào được phòng.';
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/games" className="text-sm font-medium text-brand hover:underline">
            ← Danh sách trò chơi
          </Link>
          <h1 className="mt-1 font-display text-4xl">Chơi với bạn bè</h1>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Tạo phòng hoặc nhập mã để chơi cờ vua / ô ăn quan trên hai thiết bị. Máy chủ xác thực nước đi và tính Elo
            khi ván kết thúc.
          </p>
        </div>
        <ConnectionStatus status={connection} />
      </div>

      {lastError ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-100">
          {lastError}
        </p>
      ) : null}

      <section className="rounded-3xl bg-white p-5 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        <h2 className="font-display text-2xl">Tạo phòng</h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Choice active={game === 'chess'} onClick={() => setGame('chess')}>
            Cờ vua
          </Choice>
          <Choice active={game === 'o-an-quan'} onClick={() => setGame('o-an-quan')}>
            Ô ăn quan
          </Choice>
        </div>
        {game === 'chess' ? (
          <>
            <h3 className="mt-5 text-sm font-semibold">Màu quân của bạn</h3>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Choice active={colorPref === 'random'} onClick={() => setColorPref('random')}>
                Ngẫu nhiên
              </Choice>
              <Choice active={colorPref === 'w'} onClick={() => setColorPref('w')}>
                Trắng
              </Choice>
              <Choice active={colorPref === 'b'} onClick={() => setColorPref('b')}>
                Đen
              </Choice>
            </div>
            <h3 className="mt-5 text-sm font-semibold">Đồng hồ (máy chủ giữ giờ)</h3>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Choice active={timeControl === 'off'} onClick={() => setTimeControl('off')}>
                Không giới hạn
              </Choice>
              <Choice active={timeControl === '5m'} onClick={() => setTimeControl('5m')}>
                5 phút
              </Choice>
              <Choice active={timeControl === '10m'} onClick={() => setTimeControl('10m')}>
                10 phút
              </Choice>
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-stone-500">Người tạo phòng cầm hàng dưới (Người chơi 1).</p>
        )}
        <Button className="mt-5 w-full" disabled={busy || connection === 'disconnected'} onClick={() => void createRoom()}>
          Tạo phòng
        </Button>
      </section>

      <section className="rounded-3xl bg-white p-5 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        <h2 className="font-display text-2xl">Tham gia phòng</h2>
        <label className="mt-4 block">
          <span className="text-sm font-medium">Mã phòng</span>
          <input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            placeholder="Ví dụ: 7K3QMP"
            className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 font-mono tracking-[0.2em] outline-none ring-brand focus:ring-2 dark:border-stone-600 dark:bg-stone-800"
          />
        </label>
        <Button
          variant="secondary"
          className="mt-4 w-full"
          disabled={busy || joinCode.trim().length < 6}
          onClick={() => void joinRoom()}
        >
          Tham gia phòng
        </Button>
      </section>
    </div>
  );
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl px-3 py-2.5 text-sm font-medium ring-1 transition',
        active
          ? 'bg-brand text-white ring-brand'
          : 'bg-white text-stone-600 ring-stone-300 hover:bg-stone-50 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-600',
      )}
    >
      {children}
    </button>
  );
}
