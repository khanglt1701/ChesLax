import { useEffect, useRef, useState } from 'react';
import { GameBoardLayout } from '@/components/layout/GameBoardLayout';
import { GameRatingPanel } from '@/components/ranking/GameRatingPanel';
import { RatingChangeModal } from '@/components/ranking/RatingChangeModal';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GameStatus } from '@/components/ui/GameStatus';
import { MoveHistory } from '@/components/ui/MoveHistory';
import { PlayerInfo } from '@/components/ui/PlayerInfo';
import { aiOpponentPersona } from '@/ranking/aiOpponentPersona';
import type { RatingChange } from '@/ranking/ratingTypes';
import { useRatingStore } from '@/ranking/ratingStore';
import { useStatsStore } from '@/store/statsStore';
import { CaroBoard } from './CaroBoard';
import { CARO_AI_RATINGS, aiParamsFor, caroLevelLabel, chooseCaroMove } from './caroAi';
import {
  createInitialState,
  describeMove,
  otherMark,
  place,
  resultLabel,
  type CaroMark,
  type CaroState,
} from './caroEngine';

type Opponent = 'ai' | 'local';
type Level = 'easy' | 'medium' | 'hard';

interface CaroSettings {
  opponent: Opponent;
  playerMark: CaroMark;
  level: Level;
}

const LEVELS: Level[] = ['easy', 'medium', 'hard'];

export function CaroPage() {
  const [settings, setSettings] = useState<CaroSettings>({ opponent: 'ai', playerMark: 'x', level: 'medium' });
  const [state, setState] = useState<CaroState>(createInitialState);
  const [past, setPast] = useState<CaroState[]>([]);
  const [moves, setMoves] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [resultOpen, setResultOpen] = useState(false);
  const [ratingChange, setRatingChange] = useState<RatingChange | null>(null);
  const recordedRef = useRef(false);
  const matchIdRef = useRef(createMatchId());
  const recordResult = useStatsStore((store) => store.recordResult);
  const applyMatch = useRatingStore((store) => store.applyMatch);
  const rating = useRatingStore((store) => store.ratings.caro);
  const aiMark = otherMark(settings.playerMark);
  const versusAi = settings.opponent === 'ai';

  function resetGame(next: CaroSettings = settings) {
    setSettings(next);
    setState(createInitialState());
    setPast([]);
    setMoves([]);
    setThinking(false);
    setConfirmReset(false);
    setResultOpen(false);
    setRatingChange(null);
    recordedRef.current = false;
    matchIdRef.current = createMatchId();
  }

  function commit(index: number, base: CaroState) {
    const mark = base.turn;
    const next = place(base, index, mark);
    setPast((current) => [...current, base]);
    setMoves((current) => [...current, describeMove(mark, index, base.size)]);
    setState(next);
    if (next.status === 'ended') finish(next);
  }

  function finish(next: CaroState) {
    if (recordedRef.current || !next.winner) return;
    recordedRef.current = true;
    const outcome = next.winner === 'draw' ? 'draw' : next.winner === 'x' ? 'p1' : 'p2';
    recordResult('caro', outcome, resultLabel(next));
    if (versusAi && next.winner) {
      const result = next.winner === 'draw' ? 'draw' : next.winner === settings.playerMark ? 'win' : 'loss';
      const persona = aiOpponentPersona(settings.level);
      setRatingChange(
        applyMatch({
          matchId: matchIdRef.current,
          gameId: 'caro',
          finished: true,
          rated: true,
          result,
          opponentRating: CARO_AI_RATINGS[settings.level],
          opponentName: persona.name,
        }),
      );
    }
    setResultOpen(true);
  }

  function onPlace(index: number) {
    if (thinking || state.status !== 'playing') return;
    if (versusAi && state.turn !== settings.playerMark) return;
    if (state.cells[index] !== 0) return;
    commit(index, state);
  }

  function undo() {
    if (thinking || past.length === 0 || (state.status === 'ended' && versusAi)) return;
    const steps =
      versusAi && state.lastIndex !== null && state.cells[state.lastIndex] === (aiMark === 'x' ? 1 : 2) && past.length >= 2
        ? 2
        : 1;
    const target = past[past.length - steps];
    if (!target) return;
    setState(target);
    setPast((current) => current.slice(0, -steps));
    setMoves((current) => current.slice(0, -steps));
    setResultOpen(false);
    recordedRef.current = false;
  }

  useEffect(() => {
    if (!versusAi || state.status !== 'playing' || state.turn !== aiMark) return;
    let cancelled = false;
    setThinking(true);
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      try {
        const index = chooseCaroMove(state, aiParamsFor(settings.level));
        commit(index, state);
      } finally {
        if (!cancelled) setThinking(false);
      }
    }, 420);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      setThinking(false);
    };
    // commit closes over the latest helpers; the effect should only react to the position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiMark, settings.level, state, versusAi]);

  const canEditSetup = moves.length === 0 && !thinking;
  const yourTurn = !versusAi || state.turn === settings.playerMark;
  const statusText =
    state.status === 'ended' ? resultLabel(state) : thinking ? 'Máy đang tính nước...' : resultLabel(state);
  const persona = aiOpponentPersona(settings.level);

  return (
    <>
      <GameBoardLayout
        title="Caro"
        subtitle="Bàn 12×12 · luật chặn hai đầu"
        board={
          <div className="space-y-4">
            {canEditSetup ? (
              <div className="flex flex-wrap gap-2">
                <Choice active={settings.opponent === 'ai'} onClick={() => setSettings({ ...settings, opponent: 'ai' })}>
                  Đấu với máy
                </Choice>
                <Choice
                  active={settings.opponent === 'local'}
                  onClick={() => setSettings({ ...settings, opponent: 'local' })}
                >
                  Hai người
                </Choice>
                {versusAi
                  ? LEVELS.map((level) => (
                      <Choice
                        key={level}
                        active={settings.level === level}
                        onClick={() => setSettings({ ...settings, level })}
                      >
                        {caroLevelLabel(level)}
                      </Choice>
                    ))
                  : null}
                {versusAi ? (
                  <>
                    <Choice
                      active={settings.playerMark === 'x'}
                      onClick={() => setSettings({ ...settings, playerMark: 'x' })}
                    >
                      Bạn cầm X
                    </Choice>
                    <Choice
                      active={settings.playerMark === 'o'}
                      onClick={() => setSettings({ ...settings, playerMark: 'o' })}
                    >
                      Bạn cầm O
                    </Choice>
                  </>
                ) : null}
              </div>
            ) : null}
            <CaroBoard
              cells={state.cells}
              size={state.size}
              turn={state.turn}
              lastIndex={state.lastIndex}
              winningLine={state.winningLine}
              disabled={thinking || state.status !== 'playing' || !yourTurn}
              onPlace={onPlace}
            />
          </div>
        }
        sidebar={
          <>
            <PlayerInfo
              name={versusAi ? (settings.playerMark === 'x' ? 'Bạn · X' : persona.name) : 'Người chơi 1 · X'}
              detail={versusAi && settings.playerMark === 'o' ? `${caroLevelLabel(settings.level)} · Elo ${CARO_AI_RATINGS[settings.level]}` : 'Đi trước'}
              active={state.status === 'playing' && state.turn === 'x' && !thinking}
            />
            <PlayerInfo
              name={versusAi ? (settings.playerMark === 'o' ? 'Bạn · O' : persona.name) : 'Người chơi 2 · O'}
              detail={versusAi && settings.playerMark === 'x' ? `${caroLevelLabel(settings.level)} · Elo ${CARO_AI_RATINGS[settings.level]}` : 'Đi sau'}
              active={state.status === 'playing' && state.turn === 'o' && !thinking}
            />
            <GameStatus label={statusText} tone={state.status === 'ended' ? (state.winner === 'draw' ? 'success' : 'warning') : 'neutral'} />
            <GameRatingPanel rating={rating} gameLabel="Elo caro" ratedMatch={versusAi} />
            <MoveHistory moves={moves} />
          </>
        }
        controls={
          <>
            <Button variant="secondary" onClick={() => (moves.length ? setConfirmReset(true) : resetGame())} disabled={thinking}>
              Ván mới
            </Button>
            <Button variant="secondary" onClick={undo} disabled={thinking || past.length === 0 || (state.status === 'ended' && versusAi)}>
              Hoàn tác
            </Button>
            <Button variant="ghost" onClick={() => setShowGuide((value) => !value)}>
              {showGuide ? 'Ẩn hướng dẫn' : 'Hiện hướng dẫn'}
            </Button>
          </>
        }
        guide={
          showGuide ? (
            <div className="rounded-2xl bg-white/80 p-4 text-sm leading-6 text-stone-600 ring-1 ring-stone-200 dark:bg-stone-900/70 dark:text-stone-300 dark:ring-stone-700">
              <h2 className="font-semibold text-ink dark:text-paper">Luật đang áp dụng</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Bàn 12×12, cố định trong suốt ván. X đi trước, hai bên lần lượt đặt một quân vào ô trống.</li>
                <li>Thắng khi có ít nhất 5 quân liên tiếp theo hàng ngang, dọc hoặc chéo, và chuỗi đó không bị chặn cùng lúc ở cả hai đầu.</li>
                <li>Một đầu bị chặn khi ô kế tiếp là quân đối phương hoặc khi chuỗi chạm mép bàn. Chỉ cần một đầu còn mở là chuỗi vẫn thắng, kể cả chuỗi dài hơn năm quân.</li>
                <li>Hết ô mà không có chuỗi thắng thì hòa.</li>
                <li>Đấu với máy tính Elo trên thiết bị này. Hai người trên cùng máy không tính điểm. Xếp hạng online dùng Elo máy chủ.</li>
              </ul>
            </div>
          ) : null
        }
      />
      <ConfirmDialog
        open={confirmReset}
        title="Bắt đầu ván mới?"
        message="Ván đang chơi sẽ bị xóa."
        confirmLabel="Bắt đầu lại"
        onConfirm={() => resetGame()}
        onCancel={() => setConfirmReset(false)}
      />
      <RatingChangeModal
        open={resultOpen}
        title={resultLabel(state)}
        message={versusAi ? `Đối thủ ${persona.name} · mức ${caroLevelLabel(settings.level)}` : 'Ván hai người trên cùng thiết bị.'}
        change={ratingChange}
        unratedNote={versusAi ? undefined : 'Ván hai người trên cùng thiết bị không tính điểm xếp hạng.'}
        onPlayAgain={() => resetGame()}
        onClose={() => setResultOpen(false)}
      />
    </>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-xl bg-brand px-3 py-2 text-sm font-medium text-white'
          : 'rounded-xl bg-white px-3 py-2 text-sm font-medium text-stone-600 ring-1 ring-stone-300 dark:bg-stone-800 dark:text-stone-200 dark:ring-stone-600'
      }
    >
      {children}
    </button>
  );
}

function createMatchId(): string {
  return `caro-local-${crypto.randomUUID()}`;
}
