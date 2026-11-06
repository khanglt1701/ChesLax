import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  availableSides,
  cleanNames,
  dealGame,
  roleCounts,
  roleLabel,
  sideLabel,
  type ImposterMode,
} from './rules';
import { emptySession, loadSession, saveSession, type OfflineSession } from './storage';
import { CATEGORIES, categoryLabel } from './words';

const fieldClass =
  'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base dark:border-stone-600 dark:bg-stone-800';

export function ImposterPage({ random = Math.random }: { random?: () => number }) {
  const [session, setSession] = useState<OfflineSession>(() => loadSession());
  const [held, setHeld] = useState(false);
  const [hasPeeked, setHasPeeked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    saveSession(session);
  }, [session]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.register('/imposter-sw.js').catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!session.timerEndsAt) return undefined;
    const id = window.setInterval(() => setTick((value) => value + 1), 250);
    return () => window.clearInterval(id);
  }, [session.timerEndsAt]);

  const names = cleanNames(session.names);
  const counts = roleCounts(session.mode, Math.max(names.length, 3), session.imposterCount, session.undercoverCount);
  const player = session.deal?.players[session.index];

  function update(patch: Partial<OfflineSession>) {
    setSession((current) => ({ ...current, ...patch }));
  }

  function start() {
    if (names.length < 3) {
      setError('Cần ít nhất 3 tên khác nhau.');
      return;
    }
    try {
      const deal = dealGame(
        session.names,
        session.mode,
        session.imposterCount,
        session.undercoverCount,
        session.category || null,
        session.difficulty,
        session.recentWords,
        random,
      );
      setError(null);
      setHeld(false);
      setHasPeeked(false);
      update({
        phase: 'reveal',
        deal,
        index: 0,
        answerVisible: false,
        winner: null,
        timerEndsAt: null,
        recentWords: [deal.civilianWord, ...session.recentWords.filter((word) => word !== deal.civilianWord)].slice(0, 20),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không tạo được ván.');
    }
  }

  function confirmSeen() {
    if (!session.deal || !hasPeeked) return;
    const next = session.index + 1;
    setHeld(false);
    setHasPeeked(false);
    if (next >= session.deal.players.length) {
      update({ phase: 'play', index: next });
      return;
    }
    update({ index: next });
  }

  function playAgain() {
    if (!session.deal) return;
    const deal = dealGame(
      session.deal.players.map((item) => item.name),
      session.mode,
      session.imposterCount,
      session.undercoverCount,
      session.category || null,
      session.difficulty,
      session.recentWords,
      random,
    );
    setHeld(false);
    setHasPeeked(false);
    update({
      phase: 'reveal',
      deal,
      index: 0,
      answerVisible: false,
      winner: null,
      timerEndsAt: null,
      recentWords: [deal.civilianWord, ...session.recentWords.filter((word) => word !== deal.civilianWord)].slice(0, 20),
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">Chuyền điện thoại</p>
        <h1 className="font-display text-4xl">Kẻ giả mạo</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
          Một nhóm dùng chung một điện thoại. Mỗi người chỉ xem từ của mình, rồi đặt máy xuống và chơi trực tiếp.
        </p>
      </header>

      {session.phase === 'setup' ? (
        <Setup
          session={session}
          counts={counts}
          error={error}
          onChange={update}
          onName={(index, value) => {
            const next = [...session.names];
            next[index] = value;
            update({ names: next });
          }}
          onAdd={() => update({ names: [...session.names, ''] })}
          onRemove={(index) => update({ names: session.names.filter((_, item) => item !== index) })}
          onStart={start}
        />
      ) : null}

      {session.phase === 'reveal' && player && session.deal ? (
        <section className="imposter-rise space-y-4">
          <p className="text-sm text-stone-500">
            Người {session.index + 1}/{session.deal.players.length}
          </p>
          <h2 className="font-display text-3xl">Đến lượt bạn</h2>
          <p className="text-lg font-medium">{player.name}</p>
          <p className="text-sm text-stone-500">Những người khác hãy nhìn đi chỗ khác.</p>
          <button
            type="button"
            className="flex min-h-52 w-full touch-none select-none flex-col items-center justify-center rounded-[2rem] bg-stone-900 px-6 text-center text-paper dark:bg-stone-100 dark:text-ink"
            onPointerDown={(event) => {
              if (typeof event.currentTarget.setPointerCapture === 'function') {
                try {
                  event.currentTarget.setPointerCapture(event.pointerId);
                } catch {
                  // Một số trình duyệt không giữ được con trỏ. Thả tay vẫn ẩn từ.
                }
              }
              setHeld(true);
              setHasPeeked(true);
            }}
            onPointerUp={() => setHeld(false)}
            onPointerCancel={() => setHeld(false)}
            onLostPointerCapture={() => setHeld(false)}
            onContextMenu={(event) => event.preventDefault()}
          >
            {held ? (
              <>
                <p className="text-sm uppercase tracking-[0.16em] opacity-80">{roleLabel(player.role)}</p>
                <p className="mt-3 font-display text-5xl">{player.word ?? 'Không có từ'}</p>
              </>
            ) : (
              <p className="font-display text-3xl">Nhấn giữ để xem từ</p>
            )}
          </button>
          <Button className="w-full py-3 text-base" disabled={!hasPeeked} onClick={confirmSeen}>
            Tôi đã xem xong
          </Button>
        </section>
      ) : null}

      {session.phase === 'play' && session.deal ? (
        <section className="imposter-rise space-y-4 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
          <h2 className="font-display text-3xl">Bắt đầu cuộc chơi</h2>
          <p className="text-sm leading-6 text-stone-600 dark:text-stone-300">
            Mọi người đã xem xong. Đặt điện thoại xuống giữa bàn. Không mở lại máy cho đến khi muốn xem đáp án.
          </p>
          <Rules mode={session.mode} />
          <div className="rounded-2xl bg-stone-50 p-4 text-center dark:bg-stone-800">
            <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Đồng hồ, nếu muốn</p>
            <p className="font-display text-5xl">{formatTimer(session.timerEndsAt, Date.now())}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {[1, 2, 3].map((minutes) => (
                <Button key={minutes} variant="secondary" onClick={() => update({ timerEndsAt: Date.now() + minutes * 60_000 })}>
                  {minutes} phút
                </Button>
              ))}
              <Button variant="ghost" onClick={() => update({ timerEndsAt: null })}>
                Dừng
              </Button>
            </div>
          </div>
          <Button className="w-full" onClick={() => update({ phase: 'result', answerVisible: true })}>
            Tiết lộ đáp án
          </Button>
        </section>
      ) : null}

      {session.phase === 'result' && session.deal ? (
        <section className="imposter-rise space-y-4">
          <h2 className="font-display text-3xl">Tiết lộ đáp án</h2>
          <p className="rounded-3xl bg-violet-50 px-4 py-3 dark:bg-violet-950/40">
            Từ bí mật: <span className="font-display text-2xl">{session.deal.civilianWord}</span>
            {session.deal.undercoverWord ? ` · Từ nội gián: ${session.deal.undercoverWord}` : ''}
          </p>
          <p className="text-sm text-stone-500">Chủ đề: {categoryLabel(session.deal.category)}</p>
          <ul className="space-y-2">
            {session.deal.players.map((item) => (
              <li key={item.name} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
                <span className="font-medium">{item.name}</span>
                <span className="text-right text-sm">
                  {roleLabel(item.role)}
                  {item.word ? ` · ${item.word}` : ''}
                </span>
              </li>
            ))}
          </ul>
          <div>
            <p className="text-sm font-medium">Ai thắng?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {availableSides(session.mode, counts).map((side) => (
                <Button key={side} variant={session.winner === side ? 'primary' : 'secondary'} onClick={() => update({ winner: side })}>
                  {sideLabel(side)}
                </Button>
              ))}
            </div>
            {session.winner ? <p className="mt-3 text-sm">{sideLabel(session.winner)} thắng.</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={playAgain}>Chơi ván mới</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setHeld(false);
                setHasPeeked(false);
                update({ phase: 'setup', deal: null, index: 0, answerVisible: false, winner: null, timerEndsAt: null });
              }}
            >
              Tạo ván chơi
            </Button>
          </div>
        </section>
      ) : null}

      <Link to="/games" className="inline-flex text-sm text-brand">
        ← Về danh sách trò chơi
      </Link>
    </div>
  );
}

function Setup({
  session,
  counts,
  error,
  onChange,
  onName,
  onAdd,
  onRemove,
  onStart,
}: {
  session: OfflineSession;
  counts: { imposters: number; undercover: number; mrWhite: number };
  error: string | null;
  onChange: (patch: Partial<OfflineSession>) => void;
  onName: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onStart: () => void;
}) {
  return (
    <section className="space-y-4 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
      <h2 className="font-display text-2xl">Tạo ván chơi</h2>
      <div>
        <p className="text-sm font-medium">Danh sách người chơi</p>
        <div className="mt-2 space-y-2">
          {session.names.map((name, index) => (
            <div key={index} className="flex gap-2">
              <input
                aria-label={`Tên người ${index + 1}`}
                value={name}
                maxLength={16}
                onChange={(event) => onName(index, event.target.value)}
                placeholder={`Người ${index + 1}`}
                className={fieldClass + ' mt-0'}
              />
              {session.names.length > 3 ? (
                <Button variant="ghost" onClick={() => onRemove(index)} aria-label={`Xóa người ${index + 1}`}>
                  Xóa
                </Button>
              ) : null}
            </div>
          ))}
        </div>
        {session.names.length < 12 ? (
          <Button className="mt-2" variant="secondary" onClick={onAdd}>
            Thêm người
          </Button>
        ) : null}
        <p className="mt-2 text-xs text-stone-500">Từ 3 đến 12 người. Mỗi tên một người.</p>
      </div>

      <label className="block text-sm">
        Chọn chế độ
        <select
          className={fieldClass}
          value={session.mode}
          onChange={(event) => onChange({ mode: event.target.value as ImposterMode })}
        >
          <option value="classic">Cổ điển</option>
          <option value="undercover">Kẻ nội gián</option>
          <option value="mrWhite">Ngài Trắng</option>
        </select>
      </label>

      {session.mode !== 'undercover' ? (
        <label className="block text-sm">
          Số kẻ giả mạo
          <input
            type="number"
            min={session.mode === 'mrWhite' ? 0 : 1}
            max={5}
            className={fieldClass}
            value={session.imposterCount}
            onChange={(event) => onChange({ imposterCount: Number(event.target.value) })}
          />
          <span className="mt-1 block text-xs text-stone-500">Ván này có {counts.imposters} kẻ giả mạo.</span>
        </label>
      ) : (
        <label className="block text-sm">
          Số kẻ nội gián
          <input
            type="number"
            min={1}
            max={5}
            className={fieldClass}
            value={session.undercoverCount}
            onChange={(event) => onChange({ undercoverCount: Number(event.target.value) })}
          />
          <span className="mt-1 block text-xs text-stone-500">Ván này có {counts.undercover} kẻ nội gián.</span>
        </label>
      )}
      {counts.mrWhite > 0 ? <p className="text-xs text-stone-500">Có đúng một Ngài Trắng.</p> : null}

      <label className="block text-sm">
        Chủ đề
        <select className={fieldClass} value={session.category} onChange={(event) => onChange({ category: event.target.value })}>
          <option value="">Mọi chủ đề</option>
          {CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        Độ khó
        <select
          className={fieldClass}
          value={session.difficulty ?? ''}
          onChange={(event) => onChange({ difficulty: event.target.value ? (Number(event.target.value) as 1 | 2 | 3) : null })}
        >
          <option value="">Mọi mức</option>
          <option value="1">Dễ</option>
          <option value="2">Vừa</option>
          <option value="3">Khó</option>
        </select>
      </label>

      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <Button className="w-full" onClick={onStart}>
        Bắt đầu ván chơi
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          sessionStorage.removeItem('cheslax.imposter.offline');
          onChange(emptySession());
        }}
      >
        Xóa ván đã lưu
      </Button>
    </section>
  );
}

function Rules({ mode }: { mode: ImposterMode }) {
  const lines =
    mode === 'undercover'
      ? [
          'Dân thường có cùng một từ. Kẻ nội gián có một từ gần nghĩa.',
          'Lần lượt nói một gợi ý ngắn. Đừng nói thẳng từ của mình.',
          'Cùng bàn luận, rồi chỉ người các bạn nghi ngờ.',
          'Dân thường thắng khi loại hết kẻ nội gián. Kẻ nội gián thắng khi còn lại không ít hơn dân thường.',
        ]
      : mode === 'mrWhite'
        ? [
            'Hầu hết mọi người có cùng một từ. Ngài Trắng không có từ.',
            'Nếu có kẻ giả mạo, người đó cũng không có từ.',
            'Nói gợi ý, bàn luận, rồi chỉ người đáng ngờ.',
            'Ngài Trắng bị chỉ trúng thì được đoán từ một lần. Đoán đúng là Ngài Trắng thắng.',
          ]
        : [
            'Dân thường có cùng một từ bí mật. Kẻ giả mạo không có từ.',
            'Lần lượt nói một gợi ý. Kẻ giả mạo phải nói cho giống mọi người.',
            'Bàn luận rồi cùng chỉ một người.',
            'Dân thường thắng khi loại hết kẻ giả mạo. Kẻ giả mạo thắng khi số người của họ còn lại không ít hơn dân thường.',
          ];
  return (
    <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-stone-600 dark:text-stone-300">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ol>
  );
}

function formatTimer(endsAt: number | null, now: number): string {
  if (!endsAt) return '—';
  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const minutes = Math.floor(left / 60);
  const seconds = left % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
