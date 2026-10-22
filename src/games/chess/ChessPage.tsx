import { useEffect, useMemo, useRef, useState } from 'react';
import type { PieceSymbol, Square } from 'chess.js';
import { Link } from 'react-router-dom';
import { GameRatingPanel } from '@/components/ranking/GameRatingPanel';
import { RatingChangeModal } from '@/components/ranking/RatingChangeModal';
import { Button } from '@/components/ui/Button';
import { GameStatus } from '@/components/ui/GameStatus';
import { useFullscreen } from '@/hooks/useFullscreen';
import { chessAiOpponentName, CHESS_AI_RATINGS } from '@/ranking/chessAiRatings';
import type { EloResult } from '@/ranking/eloService';
import { useRatingStore } from '@/ranking/ratingStore';
import type { RatingChange } from '@/ranking/ratingTypes';
import { useStatsStore, type MatchOutcome } from '@/store/statsStore';
import { cn } from '@/utils/cn';
import { ChessBoard } from './ChessBoard';
import { ChessClockCard } from './ChessClockCard';
import { ChessMoveList } from './ChessMoveList';
import { ChessNewGameDialog } from './ChessNewGameDialog';
import { ChessSettingsDialog } from './ChessSettingsDialog';
import { PromotionDialog } from './PromotionDialog';
import { AI_LEVELS, aiLevelLabel, aiThinkDelayMs, chooseAiMove } from './chessAi';
import {
  afterMoveClock,
  createClockState,
  hasAnyClock,
  tickClock,
  timeoutLabel,
  timeoutReason,
  type ClockState,
} from './chessClock';
import { loadChessAppearance, saveChessAppearance, type ChessAppearance } from './chessAppearance';
import { loadChessSettings, playSummary, saveChessSettings, type ChessPlaySettings } from './chessSettingsStorage';
import {
  applyMove,
  getLegalMoves,
  getSnapshotFromFen,
  needsPromotion,
  outcomeFromStatus,
  startingFen,
  statusLabel,
} from './chessService';
import type { ChessAiLevel, ChessSnapshot } from './chess.types';

function findKingSquare(snapshot: ChessSnapshot): Square | null {
  if (!snapshot.inCheck) return null;
  const king = snapshot.board.flat().find((cell) => cell.piece?.type === 'k' && cell.piece.color === snapshot.turn);
  return king?.square ?? null;
}

function sideName(color: 'w' | 'b', settings: ChessPlaySettings): string {
  const colorLabel = color === 'w' ? 'Trắng' : 'Đen';
  if (settings.opponent === 'human') {
    return color === 'w' ? `Người chơi 1 — ${colorLabel}` : `Người chơi 2 — ${colorLabel}`;
  }
  if (color === settings.playerColor) return `Bạn — ${colorLabel}`;
  return `Máy (${aiLevelLabel(settings.aiLevel)}) — ${colorLabel}`;
}

export function ChessPage() {
  const [settings, setSettings] = useState<ChessPlaySettings>(loadChessSettings);
  const [appearance, setAppearance] = useState<ChessAppearance>(loadChessAppearance);
  const [fen, setFen] = useState(startingFen);
  const [pastFens, setPastFens] = useState<string[]>([]);
  const [pastClocks, setPastClocks] = useState<ClockState[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [clock, setClock] = useState<ClockState>(() => createClockState(loadChessSettings()));
  const [selected, setSelected] = useState<Square | null>(null);
  const [flipped, setFlipped] = useState(() => {
    const saved = loadChessSettings();
    return saved.opponent === 'ai' && saved.playerColor === 'b';
  });
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [aiLevelLocked, setAiLevelLocked] = useState(false);
  const recordedRef = useRef(false);
  const ratingAppliedRef = useRef(false);
  const matchIdRef = useRef(createMatchId());
  const [ratingChange, setRatingChange] = useState<RatingChange | null>(null);
  const clockRef = useRef(clock);
  const playMoveRef = useRef<(from: Square, to: Square, promotion?: PieceSymbol, sourceFen?: string) => void>(
    () => undefined,
  );
  const arenaRef = useRef<HTMLDivElement>(null);
  clockRef.current = clock;
  const { active: fullscreen, fallback: immersive, toggle: toggleFullscreen } = useFullscreen(arenaRef);
  const recordResult = useStatsStore((state) => state.recordResult);
  const applyMatch = useRatingStore((state) => state.applyMatch);
  const chessRating = useRatingStore((state) => state.ratings.chess);

  const snapshot = useMemo(() => getSnapshotFromFen(fen), [fen]);
  const timedOut = clock.timedOut;
  const isOver = snapshot.isGameOver || Boolean(timedOut);
  const clocksOn = hasAnyClock(settings);
  const versusAi = settings.opponent === 'ai';
  const humanToMove = !versusAi || snapshot.turn === settings.playerColor;
  const boardLocked = isOver || paused || !humanToMove || aiThinking;
  const matchStarted = pastFens.length > 0;
  const canChangeAiLevel = versusAi && !aiLevelLocked && !isOver;
  const legalMoves = selected && !boardLocked ? getLegalMoves(fen, selected) : [];
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
    finalizeResult(timedOut === 'w' ? 'p2' : 'p1', resultHeadline(settings, snapshot, timedOut));
  }, [settings, snapshot, timedOut]);

  useEffect(() => {
    if (!versusAi || isOver || paused || settingsOpen || humanToMove) {
      setAiThinking(false);
      return;
    }

    let cancelled = false;
    setAiThinking(true);
    const timer = window.setTimeout(() => {
      const move = chooseAiMove(fen, settings.aiLevel);
      if (cancelled || !move) {
        setAiThinking(false);
        return;
      }
      playMoveRef.current(move.from, move.to, move.promotion, fen);
      setAiThinking(false);
    }, aiThinkDelayMs(settings.aiLevel));

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [fen, versusAi, isOver, paused, settingsOpen, humanToMove, settings.aiLevel]);

  function resetGame(nextSettings: ChessPlaySettings = settings) {
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
    setAiThinking(false);
    setAiLevelLocked(false);
    setFlipped(nextSettings.opponent === 'ai' && nextSettings.playerColor === 'b');
    setRatingChange(null);
    recordedRef.current = false;
    ratingAppliedRef.current = false;
    matchIdRef.current = createMatchId();
  }

  function finalizeResult(outcome: MatchOutcome, label: string) {
    if (recordedRef.current) return;
    recordedRef.current = true;
    recordResult('chess', outcome, label);
    if (versusAi) {
      const change = applyMatch({
        matchId: matchIdRef.current,
        gameId: 'chess',
        finished: true,
        rated: true,
        result: eloResultForPlayer(settings.playerColor, outcome),
        opponentRating: CHESS_AI_RATINGS[settings.aiLevel],
        opponentName: chessAiOpponentName(settings.aiLevel),
      });
      ratingAppliedRef.current = true;
      setRatingChange(change);
    } else {
      setRatingChange(null);
    }
    setResultOpen(true);
  }

  function applySettings(next: ChessPlaySettings) {
    saveChessSettings(next);
    setSettings(next);
    setSettingsOpen(false);
    resetGame(next);
  }

  function startNewGame(nextLevel: ChessAiLevel = settings.aiLevel) {
    const next = versusAi && nextLevel !== settings.aiLevel ? { ...settings, aiLevel: nextLevel } : settings;
    if (next !== settings) {
      saveChessSettings(next);
      setSettings(next);
    }
    resetGame(next);
  }

  function chooseAiLevel(level: ChessAiLevel) {
    if (!canChangeAiLevel || settings.aiLevel === level) return;
    const next = { ...settings, aiLevel: level };
    saveChessSettings(next);
    setSettings(next);
  }

  function playMove(from: Square, to: Square, promotion?: PieceSymbol, sourceFen = fen) {
    if (paused || isOver) return;
    try {
      const result = applyMove(sourceFen, from, to, promotion);
      setPastFens((current) => [...current, sourceFen]);
      setPastClocks((current) => [...current, clockRef.current]);
      setHistory((current) => [...current, result.san]);
      setFen(result.fen);
      setLastMove({ from: result.from, to: result.to });
      setSelected(null);
      setPendingPromotion(null);
      setClock((current) => afterMoveClock(current, settings));
      setAiLevelLocked(true);
      const nextSnap = getSnapshotFromFen(result.fen);
      const outcome = outcomeFromStatus(nextSnap.status, nextSnap.turn);
      if (outcome) {
        finalizeResult(outcome, resultHeadline(settings, nextSnap, null));
      }
    } catch {
      setSelected(null);
    }
  }
  playMoveRef.current = playMove;

  function handleSquareClick(square: Square) {
    if (boardLocked) return;
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
    const canSelect =
      cell?.piece &&
      cell.piece.color === snapshot.turn &&
      (!versusAi || cell.piece.color === settings.playerColor);
    if (canSelect) {
      setSelected(square);
      return;
    }
    setSelected(null);
  }

  function undo() {
    if (pastFens.length === 0) return;

    let nextFen = fen;
    let nextPast = [...pastFens];
    let nextClocks = [...pastClocks];
    let nextHistory = [...history];
    let restoredClock: ClockState | null = null;

    const pop = () => {
      const previous = nextPast.at(-1);
      const previousClock = nextClocks.at(-1);
      if (!previous) return false;
      nextFen = previous;
      restoredClock = previousClock ?? null;
      nextPast = nextPast.slice(0, -1);
      nextClocks = nextClocks.slice(0, -1);
      nextHistory = nextHistory.slice(0, -1);
      return true;
    };

    if (!pop()) return;
    if (versusAi) {
      while (nextPast.length && getSnapshotFromFen(nextFen).turn !== settings.playerColor) {
        if (!pop()) break;
      }
    }

    setFen(nextFen);
    setPastFens(nextPast);
    setPastClocks(nextClocks);
    setHistory(nextHistory);
    setClock(restoredClock ?? createClockState(settings));
    setSelected(null);
    setPendingPromotion(null);
    setLastMove(null);
    setResultOpen(false);
    setAiThinking(false);
    if (!ratingAppliedRef.current) recordedRef.current = false;
  }

  const resultTitle = resultHeadline(settings, snapshot, timedOut);
  const resultMessage = timedOut
    ? timeoutReason(settings, clock.moveRemainingMs)
    : versusAi
      ? 'Bạn có thể xem lại bàn cờ, hoàn tác nước cuối hoặc bắt đầu ván mới và chọn lại mức máy.'
      : 'Bạn có thể xem lại bàn cờ, hoàn tác nước cuối hoặc bắt đầu ván mới.';

  const statusTone =
    snapshot.status === 'checkmate' || timedOut
      ? 'danger'
      : snapshot.status === 'check'
        ? 'warning'
        : isOver
          ? 'success'
          : paused || aiThinking
            ? 'warning'
            : 'neutral';

  const statusText = liveStatus(settings, snapshot, timedOut, paused, aiThinking);

  const topColor: 'w' | 'b' = flipped ? 'w' : 'b';
  const bottomColor: 'w' | 'b' = flipped ? 'b' : 'w';

  const whiteClock = (
    <ChessClockCard
      name={sideName('w', settings)}
      color="w"
      active={!isOver && snapshot.turn === 'w'}
      gameMs={clock.gameRemainingMs.w}
      moveMs={snapshot.turn === 'w' ? clock.moveRemainingMs : settings.moveTimeMs}
      showGame={settings.gameTimeMs > 0}
      showMove={settings.moveTimeMs > 0}
      compact
    />
  );
  const blackClock = (
    <ChessClockCard
      name={sideName('b', settings)}
      color="b"
      active={!isOver && snapshot.turn === 'b'}
      gameMs={clock.gameRemainingMs.b}
      moveMs={snapshot.turn === 'b' ? clock.moveRemainingMs : settings.moveTimeMs}
      showGame={settings.gameTimeMs > 0}
      showMove={settings.moveTimeMs > 0}
      compact
    />
  );

  return (
    <div
      ref={arenaRef}
      className={cn(
        'chess-arena relative space-y-5 bg-paper text-ink dark:bg-[#161310] dark:text-paper',
        (fullscreen || immersive) && 'fixed inset-0 z-[80] flex flex-col overflow-auto p-3 sm:p-5',
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
          <p className="mt-1 text-sm text-stone-500">{playSummary(settings)}</p>
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

      {versusAi ? (
        <div>
          <div className="flex flex-wrap gap-2">
            {AI_LEVELS.map((level) => (
              <button
                key={level.id}
                type="button"
                disabled={!canChangeAiLevel}
                onClick={() => chooseAiLevel(level.id)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition',
                  settings.aiLevel === level.id
                    ? 'bg-brand text-white ring-brand'
                    : 'bg-white text-stone-600 ring-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-600',
                  canChangeAiLevel
                    ? 'hover:bg-stone-50 dark:hover:bg-stone-700'
                    : 'cursor-not-allowed opacity-70',
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-stone-500">
            {canChangeAiLevel
              ? 'Chọn độ khó trước nước đi đầu. Không đổi được giữa trận.'
              : 'Độ khó đã khóa cho ván này. Chọn lại khi bắt đầu ván mới.'}
          </p>
        </div>
      ) : null}

      <div
        className={cn(
          'grid gap-5',
          fullscreen ? 'lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start' : 'lg:grid-cols-[minmax(0,1fr)_280px]',
        )}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {topColor === 'b' ? blackClock : whiteClock}
            {bottomColor === 'w' ? whiteClock : blackClock}
          </div>
          <ChessBoard
            board={snapshot.board}
            flipped={flipped}
            selected={selected}
            legalTargets={legalTargets}
            lastMove={lastMove}
            checkedKing={findKingSquare(snapshot)}
            disabled={boardLocked}
            expanded={fullscreen}
            boardTheme={appearance.boardTheme}
            pieceSet={appearance.pieceSet}
            onSquareClick={handleSquareClick}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => (matchStarted || history.length || versusAi ? setConfirmReset(true) : resetGame())}
            >
              Ván mới
            </Button>
            <Button variant="secondary" onClick={undo} disabled={pastFens.length === 0 || aiThinking}>
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
                <li>Đấu với máy có 3 mức Dễ, Vừa, Khó. Chọn mức khi bắt đầu ván; không đổi được giữa trận.</li>
                <li>Đồng hồ tổng đếm ngược cho cả ván của mỗi bên; đồng hồ nước đi reset sau mỗi nước.</li>
                <li>Hết giờ thì đối phương thắng. Có thể tạm dừng, lật bàn và bật toàn màn hình.</li>
                <li>Đấu với máy tính điểm Elo trên thiết bị. Hai người trên cùng máy không tính xếp hạng.</li>
              </ul>
            </div>
          ) : null}
        </div>
        <aside className="space-y-4">
          <GameStatus label={statusText} tone={statusTone} />
          <GameRatingPanel
            rating={chessRating}
            gameLabel="Elo cờ vua"
            ratedMatch={versusAi}
            opponentName={versusAi ? chessAiOpponentName(settings.aiLevel) : undefined}
            opponentRating={versusAi ? CHESS_AI_RATINGS[settings.aiLevel] : undefined}
          />
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

      {aiThinking && !isOver && !paused ? (
        <div className="pointer-events-none absolute inset-x-0 top-[18%] z-20 flex justify-center">
          <p className="rounded-full bg-stone-900/80 px-4 py-2 text-sm font-medium text-white shadow-lg">
            Máy đang suy nghĩ…
          </p>
        </div>
      ) : null}

      <ChessSettingsDialog
        open={settingsOpen}
        value={settings}
        appearance={appearance}
        contained
        onCancel={() => setSettingsOpen(false)}
        onApply={applySettings}
        onAppearanceChange={(next) => {
          saveChessAppearance(next);
          setAppearance(next);
        }}
      />
      <PromotionDialog
        open={Boolean(pendingPromotion)}
        color={snapshot.turn}
        pieceSet={appearance.pieceSet}
        contained
        onSelect={(piece) => {
          if (!pendingPromotion) return;
          playMove(pendingPromotion.from, pendingPromotion.to, piece);
        }}
        onCancel={() => setPendingPromotion(null)}
      />
      <ChessNewGameDialog
        open={confirmReset}
        contained
        versusAi={versusAi}
        aiLevel={settings.aiLevel}
        hasProgress={matchStarted && !isOver}
        onConfirm={(level) => startNewGame(level)}
        onCancel={() => setConfirmReset(false)}
      />
      <RatingChangeModal
        open={resultOpen}
        contained
        title={resultTitle}
        message={resultMessage}
        change={versusAi ? ratingChange : null}
        unratedNote={versusAi ? undefined : 'Ván hai người trên cùng thiết bị không tính điểm xếp hạng.'}
        onPlayAgain={() => {
          setResultOpen(false);
          if (versusAi) {
            setConfirmReset(true);
            return;
          }
          resetGame();
        }}
        onClose={() => setResultOpen(false)}
      />
    </div>
  );
}

function createMatchId(): string {
  return crypto.randomUUID();
}

function eloResultForPlayer(playerColor: 'w' | 'b', outcome: MatchOutcome): EloResult {
  if (outcome === 'draw') return 'draw';
  const whiteWon = outcome === 'p1';
  return whiteWon === (playerColor === 'w') ? 'win' : 'loss';
}

function liveStatus(
  settings: ChessPlaySettings,
  snapshot: ChessSnapshot,
  timedOut: 'w' | 'b' | null,
  paused: boolean,
  aiThinking: boolean,
): string {
  if (timedOut) return resultHeadline(settings, snapshot, timedOut);
  if (paused) return 'Đã tạm dừng đồng hồ';
  if (aiThinking) return 'Máy đang suy nghĩ';
  if (snapshot.isGameOver) return resultHeadline(settings, snapshot, null);
  if (settings.opponent === 'ai') {
    const yourTurn = snapshot.turn === settings.playerColor;
    if (snapshot.inCheck) return yourTurn ? 'Bạn đang bị chiếu' : 'Máy đang bị chiếu';
    return yourTurn ? 'Lượt của bạn' : 'Lượt của máy';
  }
  return statusLabel(snapshot.status, snapshot.turn);
}

function resultHeadline(
  settings: ChessPlaySettings,
  snapshot: ChessSnapshot,
  timedOut: 'w' | 'b' | null,
): string {
  if (settings.opponent !== 'ai') {
    return timedOut ? timeoutLabel(timedOut) : statusLabel(snapshot.status, snapshot.turn);
  }
  if (timedOut) {
    return timedOut === settings.playerColor ? 'Máy thắng — bạn hết giờ' : 'Bạn thắng — máy hết giờ';
  }
  if (snapshot.status === 'checkmate') {
    return snapshot.turn === settings.playerColor ? 'Máy thắng — chiếu hết' : 'Bạn thắng — chiếu hết';
  }
  return statusLabel(snapshot.status, snapshot.turn);
}
