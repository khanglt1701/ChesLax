import { useRef, useState } from 'react';
import { GameBoardLayout } from '@/components/layout/GameBoardLayout';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GameResultModal } from '@/components/ui/GameResultModal';
import { GameStatus } from '@/components/ui/GameStatus';
import { MoveHistory } from '@/components/ui/MoveHistory';
import { PlayerInfo } from '@/components/ui/PlayerInfo';
import { useStatsStore } from '@/store/statsStore';
import { OAnQuanBoard } from './OAnQuanBoard';
import {
  applyMove,
  createInitialState,
  getValidPits,
  playerName,
  resultLabel,
  scoreOf,
  screenDirectionToEngine,
} from './oAnQuanEngine';
import type { Direction, OAnQuanEvent, OAnQuanState } from './oAnQuan.types';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function applyVisualEvent(state: OAnQuanState, event: OAnQuanEvent): OAnQuanState {
  const next = structuredClone(state);
  switch (event.type) {
    case 'pick':
    case 'relay':
      next.pits[event.pit].dan = 0;
      break;
    case 'drop':
      next.pits[event.pit].dan += 1;
      break;
    case 'capture':
      next.captured[next.currentPlayer].dan += next.pits[event.pit].dan;
      next.captured[next.currentPlayer].quan += next.pits[event.pit].quan;
      next.pits[event.pit].dan = 0;
      next.pits[event.pit].quan = 0;
      break;
    case 'resupply':
      next.currentPlayer = event.player;
      for (const pit of next.pits) {
        if (pit.owner === event.player) pit.dan += 1;
      }
      break;
    case 'turnEnd':
      next.currentPlayer = event.nextPlayer;
      break;
    case 'gameEnd':
      next.status = 'ended';
      next.winner = event.winner;
      break;
    default:
      break;
  }
  return next;
}

export function OAnQuanPage() {
  const [state, setState] = useState<OAnQuanState>(createInitialState);
  const [display, setDisplay] = useState<OAnQuanState>(createInitialState);
  const [past, setPast] = useState<OAnQuanState[]>([]);
  const [moves, setMoves] = useState<string[]>([]);
  const [selectedPit, setSelectedPit] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [highlight, setHighlight] = useState<{ pit: number; kind: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [resultOpen, setResultOpen] = useState(false);
  const recordedRef = useRef(false);
  const recordResult = useStatsStore((store) => store.recordResult);

  const validPits = busy ? [] : getValidPits(state);

  function resetGame() {
    const initial = createInitialState();
    setState(initial);
    setDisplay(initial);
    setPast([]);
    setMoves([]);
    setSelectedPit(null);
    setBusy(false);
    setHighlight(null);
    setConfirmReset(false);
    setResultOpen(false);
    recordedRef.current = false;
  }

  async function runMove(pitIndex: number, direction: Direction) {
    const result = applyMove(state, pitIndex, direction);
    setPast((current) => [...current, state]);
    setMoves((current) => [...current, result.description]);
    setSelectedPit(null);
    setBusy(true);
    let frame = structuredClone(state);
    setDisplay(frame);
    for (const event of result.events) {
      if ('pit' in event) {
        setHighlight({ pit: event.pit, kind: event.type });
      }
      frame = applyVisualEvent(frame, event);
      setDisplay(frame);
      if (event.type === 'drop') await sleep(140);
      else if (event.type === 'capture' || event.type === 'relay') await sleep(220);
      else await sleep(80);
    }
    setHighlight(null);
    setState(result.state);
    setDisplay(result.state);
    setBusy(false);
    if (result.state.status === 'ended' && !recordedRef.current) {
      recordedRef.current = true;
      const outcome = result.state.winner === 'draw' ? 'draw' : result.state.winner === 0 ? 'p1' : 'p2';
      recordResult('o-an-quan', outcome, resultLabel(result.state));
      setResultOpen(true);
    }
  }

  function handleSelectPit(index: number) {
    if (busy || state.status !== 'playing') return;
    if (!validPits.includes(index)) return;
    setSelectedPit((current) => (current === index ? null : index));
  }

  function undo() {
    const previous = past.at(-1);
    if (!previous || busy) return;
    setState(previous);
    setDisplay(previous);
    setPast((current) => current.slice(0, -1));
    setMoves((current) => current.slice(0, -1));
    setSelectedPit(null);
    setResultOpen(false);
    recordedRef.current = false;
  }

  const statusText =
    state.status === 'ended'
      ? resultLabel(state)
      : busy
        ? 'Đang rải quân...'
        : state.resupplied
          ? `${playerName(state.currentPlayer)} vừa được tiếp quân`
          : `Lượt ${playerName(state.currentPlayer)}`;

  return (
    <>
      <GameBoardLayout
        title="Ô ăn quan"
        subtitle="Hai người chơi trên cùng một thiết bị · luật phổ thông Cheslax"
        board={
          <div className="space-y-4">
            <OAnQuanBoard
              pits={display.pits}
              currentPlayer={display.currentPlayer}
              selectedPit={selectedPit}
              validPits={validPits}
              highlight={highlight}
              disabled={busy || state.status !== 'playing'}
              onSelectPit={handleSelectPit}
            />
            {selectedPit !== null ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <p className="text-sm text-stone-500">Chọn hướng rải:</p>
                <Button variant="secondary" onClick={() => void runMove(selectedPit, screenDirectionToEngine(selectedPit, 'left'))}>
                  Rải sang trái
                </Button>
                <Button onClick={() => void runMove(selectedPit, screenDirectionToEngine(selectedPit, 'right'))}>
                  Rải sang phải
                </Button>
              </div>
            ) : (
              <p className="text-center text-sm text-stone-500">
                Chọn một ô dân trên hàng của bạn, rồi chọn hướng rải trái hoặc phải.
              </p>
            )}
          </div>
        }
        sidebar={
          <>
            <PlayerInfo
              name="Người chơi 1"
              detail={`${display.captured[0].dan} dân · ${display.captured[0].quan} quan · ${scoreOf(display.captured[0])} điểm`}
              active={state.status === 'playing' && state.currentPlayer === 0 && !busy}
            />
            <PlayerInfo
              name="Người chơi 2"
              detail={`${display.captured[1].dan} dân · ${display.captured[1].quan} quan · ${scoreOf(display.captured[1])} điểm`}
              active={state.status === 'playing' && state.currentPlayer === 1 && !busy}
            />
            <GameStatus
              label={statusText}
              tone={state.status === 'ended' ? (state.winner === 'draw' ? 'success' : 'warning') : 'neutral'}
            />
            <MoveHistory moves={moves} />
          </>
        }
        controls={
          <>
            <Button
              variant="secondary"
              onClick={() => (moves.length ? setConfirmReset(true) : resetGame())}
              disabled={busy}
            >
              Ván mới
            </Button>
            <Button variant="secondary" onClick={undo} disabled={busy || past.length === 0}>
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
                <li>Mỗi ô dân bắt đầu với 5 quân dân; mỗi ô quan có 1 quân quan (quan = 5 điểm).</li>
                <li>Chỉ được chọn ô dân trên hàng của mình đang còn quân, rồi rải trái hoặc phải.</li>
                <li>Ô kế tiếp có quân dân thì lấy để rải tiếp. Ô quan có quân thì không lấy để rải.</li>
                <li>Gặp ô trống rồi ô sau còn quân thì ăn; ăn liên hoàn nếu các ô xen kẽ trống / có quân.</li>
                <li>Hết quân trên hàng thì tiếp 5 quân từ số đã ăn. Không đủ thì thua.</li>
                <li>Hết quân cả hai ô quan thì kết thúc, cộng quân còn trên hàng mình và so điểm.</li>
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
        onConfirm={resetGame}
        onCancel={() => setConfirmReset(false)}
      />
      <GameResultModal
        open={resultOpen}
        title={resultLabel(state)}
        message={`Người chơi 1: ${scoreOf(state.captured[0])} điểm · Người chơi 2: ${scoreOf(state.captured[1])} điểm`}
        onPlayAgain={resetGame}
        onClose={() => setResultOpen(false)}
      />
    </>
  );
}
