import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { isOnlineGameId, makeRoomCode, seatLabel, seatPair, type OnlineGameId } from '@/features/multiplayer/gameSync';
import { isFirebaseConfigured } from '@/services/firebase/firebaseConfig';
import { createRoom, joinRoom, RoomError } from '@/services/firebase/roomService';
import { DEFAULT_PLAYERS, shownName, usePlayerStore } from '@/store/playerStore';
import { cn } from '@/utils/cn';

const GAMES: Array<{ id: OnlineGameId; label: string }> = [
  { id: 'chess', label: 'Cờ vua' },
  { id: 'caro', label: 'Caro' },
  { id: 'o-an-quan', label: 'Ô ăn quan' },
  { id: 'co-tuong', label: 'Cờ tướng' },
  { id: 'co-ganh', label: 'Cờ Gánh' },
];

export function OnlineLobbyPage() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const locked = isOnlineGameId(gameId) ? gameId : null;
  const storedName = usePlayerStore((state) => shownName(state.players.player1, DEFAULT_PLAYERS.player1));
  const setPlayer = usePlayerStore((state) => state.setPlayer);
  const [game, setGame] = useState<OnlineGameId>(locked ?? 'chess');
  const [nickname, setNickname] = useState(storedName);
  const [goesFirst, setGoesFirst] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const configured = isFirebaseConfigured();

  if (gameId === 'imposter') return <Navigate to="/games/imposter" replace />;

  async function create() {
    const name = nickname.trim() || DEFAULT_PLAYERS.player1;
    setPlayer('player1', name);
    setBusy(true);
    setError(null);
    try {
      let created = false;
      for (let attempt = 0; attempt < 4 && !created; attempt += 1) {
        const code = makeRoomCode();
        try {
          await createRoom({ game, nickname: name, goesFirst, code });
          created = true;
          navigate(`/play/${game}/${code}`);
        } catch (caught) {
          if (!(caught instanceof RoomError) || !caught.message.includes('trùng')) throw caught;
        }
      }
      if (!created) setError('Không tạo được mã phòng. Thử lại.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không tạo được phòng.');
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    const code = joinCode.trim().toUpperCase();
    const name = nickname.trim() || DEFAULT_PLAYERS.player1;
    setPlayer('player1', name);
    setBusy(true);
    setError(null);
    try {
      await joinRoom(code, name);
      navigate(`/play/room/${code}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không vào được phòng.');
    } finally {
      setBusy(false);
    }
  }

  const pair = seatPair(game);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to={locked ? `/games/${locked}` : '/games'} className="text-sm font-medium text-brand hover:underline">
          ← {locked ? 'Ván trên máy này' : 'Trò chơi'}
        </Link>
        <h1 className="mt-1 font-display text-4xl">Chơi hai máy</h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          Tạo phòng và gửi mã cho bạn. Hai máy đồng bộ qua Firebase, không cần tài khoản. Ván trên một máy và đấu với máy vẫn chơi được khi không có mạng.
        </p>
      </div>

      {!configured ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Chưa cấu hình Firebase. Thêm biến VITE_FIREBASE_* rồi chạy lại. Chơi trên máy này vẫn dùng được.
        </p>
      ) : null}
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-200">{error}</p> : null}

      <section className="rounded-3xl bg-white p-5 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        <label className="block">
          <span className="text-sm font-medium">Biệt danh</span>
          <input
            value={nickname}
            maxLength={24}
            onChange={(event) => setNickname(event.target.value)}
            className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 outline-none ring-brand focus:ring-2 dark:border-stone-600 dark:bg-stone-800"
          />
        </label>
      </section>

      <section className="rounded-3xl bg-white p-5 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        <h2 className="font-display text-2xl">Tạo phòng</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {GAMES.map((item) => (
            <Choice key={item.id} active={game === item.id} onClick={() => !locked && setGame(item.id)}>
              {item.label}
            </Choice>
          ))}
        </div>
        <h3 className="mt-5 text-sm font-semibold">Quân của bạn</h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Choice active={goesFirst} onClick={() => setGoesFirst(true)}>
            {`Đi trước · ${seatLabel(game, pair[0])}`}
          </Choice>
          <Choice active={!goesFirst} onClick={() => setGoesFirst(false)}>
            {`Đi sau · ${seatLabel(game, pair[1])}`}
          </Choice>
        </div>
        <Button className="mt-5 w-full" disabled={busy || !configured} onClick={() => void create()}>
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
        <Button variant="secondary" className="mt-4 w-full" disabled={busy || !configured || joinCode.trim().length < 6} onClick={() => void join()}>
          Tham gia phòng
        </Button>
      </section>
    </div>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl px-3 py-2.5 text-sm font-medium ring-1 transition',
        active ? 'bg-brand text-white ring-brand' : 'bg-white text-stone-600 ring-stone-300 hover:bg-stone-50 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-600',
      )}
    >
      {children}
    </button>
  );
}
