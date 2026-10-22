import { useEffect, useMemo, useRef, useState } from 'react';
import type { PieceSymbol, Square } from 'chess.js';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GameResultModal } from '@/components/ui/GameResultModal';
import { GameStatus } from '@/components/ui/GameStatus';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useStatsStore } from '@/store/statsStore';
import { cn } from '@/utils/cn';
import { ChessBoard } from './ChessBoard';
import { ChessClockCard } from './ChessClockCard';
import { ChessMoveList } from './ChessMoveList';
import { ChessSettingsDialog } from './ChessSettingsDialog';
import { PromotionDialog } from './PromotionDialog';
import {
  afterMoveClock,
  createClockState,
  hasAnyClock,
  settingsSummary,
  tickClock,
  timeoutLabel,
  timeoutReason,
  type ChessTimeSettings,
  type ClockState,
} from './chessClock';
import { loadChessSettings, saveChessSettings } from './chessSettingsStorage';
import {
  applyMove,
  getLegalMoves,
  getSnapshotFromFen,
  needsPromotion,
  outcomeFromStatus,
  startingFen,
  statusLabel,
} from './chessService';
import type { ChessSnapshot } from './chess.types';

function findKingSquare(snapshot: ChessSnapshot): Square | null {
  if (!snapshot.inCheck) return null;
  const king = snapshot.board.flat().find((cell) => cell.piece?.type === 'k' && cell.piece.color === snapshot.turn);
  return king?.square ?? null;
}

export function ChessPage() {
  const [settings, setSettings] = useState<ChessTimeSettings>(loadChessSettings);
  const [fen, setFen] = useState(startingFen);
  const [pastFens, setPastFens] = useState<string[]>([]);
  const [pastClocks, setPastClocks] = useState<ClockState[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [clock, setClock] = useState<ClockState>(() => createClockState(loadChessSettings()));
  const [selected, setSelected] = useState<Square | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const recordedRef = useRef(false);
  const arenaRef = useRef<HTMLDivElement>(null);
  const { active: fullscreen, fallback: immersive, toggle: toggleFullscreen } = useFullscreen(arenaRef);
  const recordResult = useStatsStore((state) => state.recordResult);

  const snapshot = useMemo(() => getSnapshotFromFen(fen), [fen]);
  const timedOut = clock.timedOut;
  const isOver = snapshot.isGameOver || Boolean(timedOut);
  const clocksOn = hasAnyClock(settings);
  const legalMoves = selected && !isOver && !paused ? getLegalMoves(fen, selected) : [];
  const legalTargets = [...new Set(legalMoves.map((move) => move.to))];

  useEffect(() => {
    if (!clocksOn || isOver || paused || settingsOpen) return;
    const interval = window.setInterval(() => {
      setClock((current) => tickClock(current, settings, snapshot.turn, 100));
    }, 100);
    return () => window.clearInterval(interval);
  }, [clocksOn, isOver, paused, settings, settingsOpen, snapshot.turn]);

  useEffect(() => {
    if (!timedOut || recordedRef.current) return;
    recordedRef.current = true;
    recordResult('chess', timedOut === 'w' ? 'p2' : 'p1', timeoutLabel(timedOut));
    setResultOpen(true);
  }, [recordResult, timedOut]);

  function resetGame(nextSettings: ChessTimeSettings = settings) {
    setFen(startingFen());
    setPastFens([]);
    setPastClocks([]);
    setHistory([]);
    setClock(createClockState(nextSettings));
    setSelected(null);
    setLastMove(null);
    setPendingPromotion(null);
    setConfirmReset(false);
    setResultOpen(false);
    setPaused(false);
    recordedRef.current = false;
  }

  function applySettings(next: ChessTimeSettings) {
    saveChessSettings(next);
    setSettings(next);
    setSettingsOpen(false);
    resetGame(next);
  }

  function playMove(from: Square, to: Square, promotion?: PieceSymbol) {
    if (paused || isOver) return;
    try {
      const result = applyMove(fen, from, to, promotion);
      setPastFens((current) => [...current, fen]);
      setPastClocks((current) => [...current, clock]);
      setHistory((current) => [...current, result.san]);
      setFen(result.fen);
      setLastMove({ from: result.from, to: result.to });
      setSelected(null);
      setPendingPromotion(null);
      setClock((current) => afterMoveClock(current, settings));
      const nextSnap = getSnapshotFromFen(result.fen);
      const outcome = outcomeFromStatus(nextSnap.status, nextSnap.turn);
      if (outcome && !recordedRef.current) {
        recordedRef.current = true;
        recordResult('chess', outcome, statusLabel(nextSnap.status, nextSnap.turn));
        setResultOpen(true);
      }
    } catch {
      setSelected(null);
    }
  }

  function handleSquareClick(square: Square) {
    if (isOver || paused) return;
    if (pendingPromotion) return;

    if (selected && legalTargets.includes(square)) {
      if (needsPromotion(fen, selected, square)) {
        setPendingPromotion({ from: selected, to: square });
        return;
      }
      playMove(selected, square);
      return;
    }

    const cell = snapshot.board.flat().find((item) => item.square === square);
    if (cell?.piece && cell.piece.color === snapshot.turn) {
      setSelected(square);
      return;
    }
    setSelected(null);
  }

  function undo() {
    const previous = pastFens.at(-1);
    if (!previous) return;
    setFen(previous);
    setPastFens((current) => current.slice(0, -1));
    setHistory((current) => current.slice(0, -1));
    const previousClock = pastClocks.at(-1);
    setPastClocks((current) => current.slice(0, -1));
    if (previousClock) setClock(previousClock);
    setSelected(null);
    setPendingPromotion(null);
    setLastMove(null);
    setResultOpen(false);
    recordedRef.current = false;
  }

  const resultTitle = timedOut ? timeoutLabel(timedOut) : statusLabel(snapshot.status, snapshot.turn);
  const resultMessage = timedOut
    ? timeoutReason(settings, clock.moveRemainingMs)
    : 'Bạn có thể xem lại bàn cờ, hoàn tác nước cuối hoặc bắt đầu ván mới.';

  const statusTone =
    snapshot.status === 'checkmate' || timedOut
      ? 'danger'
      : snapshot.status === 'check'
        ? 'warning'
        : isOver
          ? 'success'
          : paused
            ? 'warning'
            : 'neutral';

  const statusText = timedOut
    ? timeoutLabel(timedOut)
    : paused
      ? 'Đã tạm dừng đồng hồ'
      : statusLabel(snapshot.status, snapshot.turn);

  const topColor: 'w' | 'b' = flipped ? 'w' : 'b';
  const bottomColor: 'w' | 'b' = flipped ? 'b' : 'w';

  const whiteClock = (
    <ChessClockCard
      name="Người chơi 1 — Trắng"
      color="w"
      active={!isOver && snapshot.turn === 'w'}
      gameMs={clock.gameRemainingMs.w}
      moveMs={snapshot.turn === 'w' ? clock.moveRemainingMs : settings.moveTimeMs}
      showGame={settings.gameTimeMs > 0}
      showMove={settings.moveTimeMs > 0}
      compact={fullscreen}
    />
  );
  const blackClock = (
    <ChessClockCard
      name="Người chơi 2 — Đen"
      color="b"
      active={!isOver && snapshot.turn === 'b'}
      gameMs={clock.gameRemainingMs.b}
      moveMs={snapshot.turn === 'b' ? clock.moveRemainingMs : settings.moveTimeMs}
      showGame={settings.gameTimeMs > 0}
      showMove={settings.moveTimeMs > 0}
      compact={fullscreen}
    />
  );

  return (
    <div
      ref={arenaRef}
      className={cn(
        'chess-arena relative space-y-5 bg-paper text-ink dark:bg-[#161310] dark:text-paper',
        (fullscreen || immersive) &&
          'fixed inset-0 z-[80] flex flex-col overflow-auto p-3 sm:p-5',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {fullscreen ? null : (
            <Link to="/games" className="text-sm font-medium text-brand hover:underline">
              ← Danh sách trò chơi
            </Link>
          )}
          <h1 className="mt-1 font-display text-3xl">Cờ vua</h1>
          <p className="mt-1 text-sm text-stone-500">{settingsSummary(settings)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
            Cài đặt
          </Button>
          <Button variant="secondary" onClick={() => void toggleFullscreen()}>
            {fullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          'grid gap-5',
          fullscreen
            ? 'lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start'
            : 'lg:grid-cols-[minmax(0,1fr)_280px]',
        )}
      >
        <div className="space-y-3">
          {topColor === 'b' ? blackClock : whiteClock}
          <ChessBoard
            board={snapshot.board}
            flipped={flipped}
            selected={selected}
            legalTargets={legalTargets}
            lastMove={lastMove}
            checkedKing={findKingSquare(snapshot)}
            disabled={isOver || paused}
            expanded={fullscreen}
            onSquareClick={handleSquareClick}
          />
          {bottomColor === 'w' ? whiteClock : blackClock}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => (pastFens.length || history.length ? setConfirmReset(true) : resetGame())}
            >
              Ván mới
            </Button>
            <Button variant="secondary" onClick={undo} disabled={pastFens.length === 0}>
              Quay lại
            </Button>
            <Button variant="secondary" onClick={() => setFlipped((value) => !value)}>
              Lật bàn
            </Button>
            {clocksOn ? (
              <Button variant="secondary" onClick={() => setPaused((value) => !value)} disabled={isOver}>
                {paused ? 'Tiếp tục' : 'Tạm dừng'}
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => setShowGuide((value) => !value)}>
              {showGuide ? 'Ẩn hướng dẫn' : 'Hướng dẫn'}
            </Button>
          </div>
          {showGuide ? (
            <div className="rounded-2xl bg-white/80 p-4 text-sm leading-6 text-stone-600 ring-1 ring-stone-200 dark:bg-stone-900/70 dark:text-stone-300 dark:ring-stone-700">
              <h2 className="font-semibold text-ink dark:text-paper">Cách chơi nhanh</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Chọn quân của bên đến lượt, rồi chọn ô hợp lệ được tô sáng.</li>
                <li>Đồng hồ tổng đếm ngược cho cả ván của mỗi bên; đồng hồ nước đi reset sau mỗi nước.</li>
                <li>Hết giờ thì đối phương thắng. Có thể tạm dừng, lật bàn và bật toàn màn hình.</li>
              </ul>
            </div>
          ) : null}
        </div>
        <aside className="space-y-4">
          <GameStatus label={statusText} tone={statusTone} />
          <ChessMoveList moves={history} />
        </aside>
      </div>

      {paused && !isOver ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex justify-center">
          <p className="rounded-full bg-stone-900/80 px-4 py-2 text-sm font-medium text-white shadow-lg">
            Đồng hồ đang tạm dừng
          </p>
        </div>
      ) : null}

      <ChessSettingsDialog
        open={settingsOpen}
        value={settings}
        contained
        onCancel={() => setSettingsOpen(false)}
        onApply={applySettings}
      />
      <PromotionDialog
        open={Boolean(pendingPromotion)}
        color={snapshot.turn}
        contained
        onSelect={(piece) => {
          if (!pendingPromotion) return;
          playMove(pendingPromotion.from, pendingPromotion.to, piece);
        }}
        onCancel={() => setPendingPromotion(null)}
      />
      <ConfirmDialog
        open={confirmReset}
        contained
        title="Bắt đầu ván mới?"
        message="Ván đang chơi sẽ bị xóa. Cài đặt thời gian vẫn được giữ."
        confirmLabel="Bắt đầu lại"
        onConfirm={() => resetGame()}
        onCancel={() => setConfirmReset(false)}
      />
      <GameResultModal
        open={resultOpen}
        contained
        title={resultTitle}
        message={resultMessage}
        onPlayAgain={() => resetGame()}
        onClose={() => setResultOpen(false)}
      />
    </div>
  );
}
