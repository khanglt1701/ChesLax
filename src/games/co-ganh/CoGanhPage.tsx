import { useEffect, useMemo, useRef, useState } from 'react';
import { GameBoardLayout } from '@/components/layout/GameBoardLayout';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GameResultModal } from '@/components/ui/GameResultModal';
import { GameStatus } from '@/components/ui/GameStatus';
import { PlayerInfo } from '@/components/ui/PlayerInfo';
import { aiOpponentName } from '@/games/aiPersona';
import { ChessMoveList } from '@/games/chess/ChessMoveList';
import { shownName, usePlayerStore } from '@/store/playerStore';
import { useStatsStore } from '@/store/statsStore';
import { readStorage, storageKey, writeStorage } from '@/utils/storage';
import { CoGanhBoard } from './CoGanhBoard.tsx';
import { aiParamsFor, aiThinkDelayMs, chooseCoGanhMove, coGanhLevelLabel } from './coGanhAi';
import { CO_GANH_BLUE, CO_GANH_RED, type CoGanhLevel, type CoGanhOpponent, type CoGanhSide, type CoGanhState } from './coGanh.types';
import {
  createInitialState,
  getLegalMoves,
  getWinner,
  otherSide,
  pieceCount,
  resultLabel,
  tryMove,
} from './coGanhEngine';


interface CoGanhSettings {
  opponent: CoGanhOpponent;
  playerSide: CoGanhSide | 'random';
  level: CoGanhLevel;
}

const AI_LEVELS: CoGanhLevel[] = ['easy', 'medium', 'hard'];
const SETTINGS_KEY = storageKey('co_ganh_settings');

function loadCoGanhSettings(): CoGanhSettings {
  const saved = readStorage<Partial<CoGanhSettings> | null>(SETTINGS_KEY, null);
  if (!saved) return { opponent: 'ai', playerSide: 'red', level: 'medium' };
  return {
    opponent: saved.opponent === 'local' ? 'local' : 'ai',
    playerSide: saved.playerSide === 'blue' || saved.playerSide === 'random' ? saved.playerSide : 'red',
    level: saved.level === 'easy' || saved.level === 'hard' ? saved.level : 'medium',
  };
}

export function CoGanhPage() {
  const [settings, setSettings] = useState<CoGanhSettings>(loadCoGanhSettings);
  const [color, setColor] = useState<CoGanhSide>('red');
  const [state, setState] = useState<CoGanhState>(createInitialState);
  const [past, setPast] = useState<CoGanhState[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [viewPly, setViewPly] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [resultOpen, setResultOpen] = useState(false);
  const recordedRef = useRef(false);
  const recordResult = useStatsStore((store) => store.recordResult);
  const players = usePlayerStore((store) => store.players);
  const versusAi = settings.opponent === 'ai';
  const playerSide = color;
  const aiSide = otherSide(playerSide);
  const reviewing = viewPly < past.length;
  const display = reviewing ? past[viewPly]! : state;
  const ended = state.status === 'ended';
  const legal = useMemo(
    () =>
      selected != null && !reviewing && !ended && !thinking
        ? getLegalMoves(state, selected).map((move) => move.to)
        : [],
    [ended, reviewing, selected, state, thinking],
  );

  function resetGame(next: CoGanhSettings = settings) {
    const side = next.playerSide === 'random' ? (Math.random() < 0.5 ? 'red' : 'blue') : next.playerSide;
    setSettings(next);
    setColor(side);
    setState(createInitialState());
    setPast([]);
    setSelected(null);
    setViewPly(0);
    setThinking(false);
    setFlipped(next.opponent === 'ai' && side === 'blue');
    setConfirmReset(false);
    setResultOpen(false);
    recordedRef.current = false;
    writeStorage(SETTINGS_KEY, next);
  }

  function commit(from: number, to: number, base: CoGanhState) {
    const applied = tryMove(base, from, to);
    if (!applied) return;
    setPast((current) => [...current, base]);
    setState(applied.state);
    setSelected(null);
    setViewPly((current) => Math.max(current, past.length) + 1);
    if (applied.state.status === 'ended') finish(applied.state);
  }

  function finish(next: CoGanhState) {
    if (recordedRef.current) return;
    recordedRef.current = true;
    const winner = getWinner(next);
    const outcome = winner === 'red' ? 'p1' : 'p2';
    recordResult('co-ganh', outcome, resultLabel(next));
    setResultOpen(true);
  }

  function onSelect(index: number) {
    if (thinking || ended || reviewing) return;
    if (versusAi && state.turn !== playerSide) return;
    if (selected != null && legal.includes(index)) {
      commit(selected, index, state);
      return;
    }
    const occupant = state.cells[index];
    const mine = state.turn === 'red' ? CO_GANH_RED : CO_GANH_BLUE;
    if (occupant === mine) {
      setSelected((current) => (current === index ? null : index));
      return;
    }
    setSelected(null);
  }

  function undo() {
    if (thinking || past.length === 0 || (ended && versusAi)) return;
    const steps = versusAi && past.length >= 2 && state.turn === playerSide ? 2 : 1;
    const target = past[past.length - steps];
    if (!target) return;
    setState(target);
    setPast((current) => current.slice(0, -steps));
    setViewPly(past.length - steps);
    setSelected(null);
    setResultOpen(false);
    recordedRef.current = false;
  }

  useEffect(() => {
    if (!versusAi || ended || state.turn !== aiSide || reviewing) return;
    let cancelled = false;
    setThinking(true);
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      try {
        const move = chooseCoGanhMove(state, aiParamsFor(settings.level));
        commit(move.from, move.to, state);
      } finally {
        if (!cancelled) setThinking(false);
      }
    }, aiThinkDelayMs(settings.level));
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      setThinking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiSide, ended, reviewing, settings.level, state, versusAi]);

  const canEditSetup = past.length === 0 && !thinking;
  const yourTurn = !versusAi || state.turn === playerSide;
  const statusText = thinking ? 'Máy đang tính nước...' : reviewing ? 'Đang xem lại nước đi' : resultLabel(state);
  const persona = aiOpponentName(settings.level);
  const redName = versusAi
    ? playerSide === 'red'
      ? shownName(players.player1, 'Bạn')
      : persona
    : shownName(players.player1, 'Người chơi 1');
  const blueName = versusAi
    ? playerSide === 'blue'
      ? shownName(players.player1, 'Bạn')
      : persona
    : shownName(players.player2, 'Người chơi 2');
  const tone = ended ? 'warning' : 'neutral';
  const redCount = pieceCount(display.cells, 'red');
  const blueCount = pieceCount(display.cells, 'blue');

  return (
    <>
      <GameBoardLayout
        title="Cờ Gánh"
        subtitle="Bàn 5×5 giao điểm · Gánh và Vây"
        board={
          <div className="space-y-4">
            {canEditSetup ? (
              <div className="flex flex-wrap gap-2">
                <Choice active={settings.opponent === 'ai'} onClick={() => resetGame({ ...settings, opponent: 'ai' })}>
                  Đấu với máy
                </Choice>
                <Choice
                  active={settings.opponent === 'local'}
                  onClick={() => resetGame({ ...settings, opponent: 'local' })}
                >
                  Hai người
                </Choice>
                {versusAi
                  ? AI_LEVELS.map((level) => (
                      <Choice key={level} active={settings.level === level} onClick={() => resetGame({ ...settings, level })}>
                        {coGanhLevelLabel(level)}
                      </Choice>
                    ))
                  : null}
                {versusAi ? (
                  <>
                    <Choice
                      active={color === 'red' && settings.playerSide !== 'random'}
                      onClick={() => resetGame({ ...settings, playerSide: 'red' })}
                    >
                      Bạn cầm Đỏ
                    </Choice>
                    <Choice
                      active={color === 'blue' && settings.playerSide !== 'random'}
                      onClick={() => resetGame({ ...settings, playerSide: 'blue' })}
                    >
                      Bạn cầm Xanh
                    </Choice>
                  </>
                ) : null}
              </div>
            ) : null}
            <CoGanhBoard
              state={display}
              selected={reviewing ? null : selected}
              legal={reviewing ? [] : legal}
              flipped={flipped}
              disabled={thinking || ended || reviewing || !yourTurn}
              onSelect={onSelect}
            />
          </div>
        }
        sidebar={
          <>
            <PlayerInfo
              name={`${blueName} · Xanh`}
              detail={`${blueCount} quân${versusAi && playerSide === 'red' ? ` · ${coGanhLevelLabel(settings.level)}` : ''}`}
              active={!ended && display.turn === 'blue' && !thinking}
            />
            <PlayerInfo
              name={`${redName} · Đỏ`}
              detail={`${redCount} quân${versusAi && playerSide === 'blue' ? ` · ${coGanhLevelLabel(settings.level)}` : ''}`}
              active={!ended && display.turn === 'red' && !thinking}
            />
            <GameStatus label={statusText} tone={tone} />
            <ChessMoveList
              moves={state.history}
              ply={reviewing ? viewPly : state.history.length}
              onPlyChange={(ply) => setViewPly(ply)}
            />
          </>
        }
        controls={
          <>
            <Button variant="secondary" onClick={() => (past.length ? setConfirmReset(true) : resetGame())} disabled={thinking}>
              Ván mới
            </Button>
            <Button variant="secondary" onClick={undo} disabled={thinking || past.length === 0 || (ended && versusAi)}>
              Hoàn tác
            </Button>
            <Button variant="secondary" onClick={() => setViewPly((ply) => Math.max(0, (reviewing ? ply : past.length) - 1))} disabled={past.length === 0}>
              Nước trước
            </Button>
            <Button
              variant="secondary"
              onClick={() => setViewPly((ply) => Math.min(past.length, ply + 1))}
              disabled={!reviewing}
            >
              Nước sau
            </Button>
            <Button variant="ghost" onClick={() => setFlipped((value) => !value)}>
              Lật bàn
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
                <li>Bàn 5×5 giao điểm. Quân đi một bước theo đường ngang, dọc hoặc chéo được kẻ trên bàn tới điểm trống.</li>
                <li>Đỏ đi trước, mỗi bên 8 quân bố trí trên vành bàn. Chỉ được đi quân của mình.</li>
                <li>Gánh: đi vào giữa hai quân đối phương trên cùng một đường nối thì hai quân đó đổi thành quân của bạn. Có thể gánh nhiều cặp trong một nước.</li>
                <li>Vây: nhóm quân đối phương không còn đường tới giao điểm trống sẽ đổi thành quân của bạn. Bị chặn một hướng thì chưa bị vây.</li>
                <li>Thắng khi chiếm hết quân đối phương. Không kết thúc chỉ vì đang hơn quân.</li>
                <li>Hai người chơi lần lượt trên cùng thiết bị. Tên hiển thị lấy từ cài đặt.</li>
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
      <GameResultModal
        open={resultOpen}
        title={resultLabel(state)}
        message={versusAi ? `Đối thủ ${persona} · mức ${coGanhLevelLabel(settings.level)}` : 'Ván hai người trên cùng thiết bị.'}
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
