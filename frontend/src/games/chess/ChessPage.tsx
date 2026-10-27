import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { PieceSymbol, Square } from 'chess.js';
import { Link } from 'react-router-dom';
import { GameRatingPanel } from '@/components/ranking/GameRatingPanel';
import { RatingChangeModal } from '@/components/ranking/RatingChangeModal';
import { Button } from '@/components/ui/Button';
import { GameStatus } from '@/components/ui/GameStatus';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useMyRatings } from '@/hooks/useMyRatings';
import { aiOpponentPersona } from '@/ranking/aiOpponentPersona';
import { chessAiOpponentName, CHESS_AI_RATINGS } from '@/ranking/chessAiRatings';
import type { EloResult } from '@/ranking/eloService';
import { useRatingStore } from '@/ranking/ratingStore';
import type { RatingChange } from '@/ranking/ratingTypes';
import { useStatsStore, type MatchOutcome } from '@/store/statsStore';
import { cn } from '@/utils/cn';
import { AiMoveSession, scheduleAiReply } from './aiMoveSession';
import { ChessBoard } from './ChessBoard';
import { ChessClockCard } from './ChessClockCard';
import { FullscreenIcon, RedoIcon, SettingsIcon, UndoIcon } from './ChessIcons';
import { ChessMoveList } from './ChessMoveList';
import { ChessSeat } from './ChessSeat';
import { ChessNewGameDialog } from './ChessNewGameDialog';
import { ChessSettingsDialog } from './ChessSettingsDialog';
import { PromotionDialog } from './PromotionDialog';
import { AI_LEVELS, aiThinkDelayMs, chooseAiMove } from './chessAi';
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
import { loadChessSettings, saveChessSettings, type ChessPlaySettings } from './chessSettingsStorage';
import {
  applyMove,
  getAllLegalMoves,
  getLegalMoves,
  getSnapshotFromFen,
  lastMoveSquares,
  needsPromotion,
  outcomeFromStatus,
  replayToPly,
  startingFen,
  statusLabel,
} from './chessService';
import type { ChessAiLevel, ChessSnapshot } from './chess.types';
import {
  createChessLine,
  currentFen,
  lastMoveOf,
  pushPly,
  visibleSans,
  type ChessLine,
} from './chessHistory';
import { useChessMoveReview } from './useChessMoveReview';

interface ClockMarks {
  before: ClockState;
  after: ClockState;
}

function findKingSquare(snapshot: ChessSnapshot): Square | null {
  if (!snapshot.inCheck) return null;
  const king = snapshot.board.flat().find((cell) => cell.piece?.type === 'k' && cell.piece.color === snapshot.turn);
  return king?.square ?? null;
}

function newLine(): ChessLine<ClockMarks> {
  return createChessLine(startingFen());
}

export function ChessPage() {
  const [settings, setSettings] = useState<ChessPlaySettings>(loadChessSettings);
  const [appearance, setAppearance] = useState<ChessAppearance>(loadChessAppearance);
  const [line, setLine] = useState<ChessLine<ClockMarks>>(newLine);
  const [clock, setClock] = useState<ClockState>(() => createClockState(loadChessSettings()));
  const [selected, setSelected] = useState<Square | null>(null);
  const [flipped, setFlipped] = useState(() => {
    const saved = loadChessSettings();
    return saved.opponent === 'ai' && saved.playerColor === 'b';
  });
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
  const playingRef = useRef(false);
  const aiSessionRef = useRef(new AiMoveSession());
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
  const { player: me } = useMyRatings();

  const fen = currentFen(line);
  const history = visibleSans(line);
  const lastMove = lastMoveOf(line);
  const snapshot = useMemo(() => getSnapshotFromFen(fen), [fen]);
  const review = useChessMoveReview(history.length);
  const canUndo = review.ply > 0;
  const canRedo = review.reviewing;
  const viewSnapshot = review.reviewing ? replayToPly(history, review.ply) : snapshot;
  const viewLastMove = review.reviewing ? lastMoveSquares(history, review.ply) : lastMove;
  const timedOut = clock.timedOut;
  const isOver = snapshot.isGameOver || Boolean(timedOut);
  const clocksOn = hasAnyClock(settings);
  const versusAi = settings.opponent === 'ai';
  const humanToMove = !versusAi || snapshot.turn === settings.playerColor;
  const boardLocked = isOver || paused || !humanToMove || aiThinking || review.reviewing;
  const matchStarted = line.plies.length > 0;
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

    const fenAtStart = fen;
    setAiThinking(true);
    return scheduleAiReply({
      session: aiSessionRef.current,
      delayMs: aiThinkDelayMs(settings.aiLevel, {
        legalMoves: getAllLegalMoves(fenAtStart).length,
        inCheck: snapshot.inCheck,
      }),
      computeMove: () => chooseAiMove(fenAtStart, settings.aiLevel),
      applyMove: (move) => {
        playMoveRef.current(move.from, move.to, move.promotion, fenAtStart);
      },
      onSettled: () => setAiThinking(false),
    });
  }, [
    fen,
    versusAi,
    isOver,
    paused,
    settingsOpen,
    humanToMove,
    settings.aiLevel,
    snapshot.inCheck,
  ]);

  function resetGame(nextSettings: ChessPlaySettings = settings) {
    aiSessionRef.current.invalidate();
    setLine(createChessLine(startingFen()));
    setClock(createClockState(nextSettings));
    setSelected(null);
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
    review.goLast();
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
    if (paused || isOver || playingRef.current) return;
    playingRef.current = true;
    try {
      const result = applyMove(sourceFen, from, to, promotion);
      const clockAfter = afterMoveClock(
        clockRef.current,
        settings,
        sourceFen.split(' ')[1] === 'b' ? 'b' : 'w',
      );
      setLine((current) =>
        pushPly(
          current,
          {
            fen: result.fen,
            san: result.san,
            from: result.from,
            to: result.to,
            promotion: result.promotion,
          },
          { before: clockRef.current, after: clockAfter },
        ),
      );
      setClock(clockAfter);
      setSelected(null);
      setPendingPromotion(null);
      setAiLevelLocked(true);
      if (!review.reviewing) review.goLast();
      const nextSnap = getSnapshotFromFen(result.fen);
      const outcome = outcomeFromStatus(nextSnap.status, nextSnap.turn);
      if (outcome) {
        finalizeResult(outcome, resultHeadline(settings, nextSnap, null));
      }
    } catch {
      setSelected(null);
    } finally {
      playingRef.current = false;
    }
  }
  playMoveRef.current = playMove;

  function handleSquareClick(square: Square) {
    if (boardLocked || playingRef.current) return;
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
    if (!canUndo) return;
    setSelected(null);
    setPendingPromotion(null);
    review.goPrev();
  }

  function redo() {
    if (!canRedo) return;
    setSelected(null);
    setPendingPromotion(null);
    review.goNext();
  }

  const resultTitle = resultHeadline(settings, snapshot, timedOut);
  const resultMessage = timedOut
    ? timeoutReason(settings, clock.moveRemainingMs)
    : versusAi
      ? 'Bạn có thể xem lại bàn cờ hoặc bắt đầu ván mới và chọn lại mức máy.'
      : 'Bạn có thể xem lại bàn cờ hoặc bắt đầu ván mới.';

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

  const statusText = review.reviewing
    ? `Đang xem lại nước ${review.ply}/${history.length}`
    : liveStatus(settings, snapshot, timedOut, paused, aiThinking);

  const topColor: 'w' | 'b' = flipped ? 'w' : 'b';
  const bottomColor: 'w' | 'b' = flipped ? 'b' : 'w';
  const thinkingName = chessAiOpponentName(settings.aiLevel);
  const topSeat = seatIdentity(topColor, settings, me);
  const bottomSeat = seatIdentity(bottomColor, settings, me);

  const clockPill = (color: 'w' | 'b', name: string) => (
    <ChessClockCard
      name={name}
      color={color}
      variant="pill"
      active={!isOver && snapshot.turn === color}
      thinking={aiThinking && versusAi && snapshot.turn === color}
      gameMs={clock.gameRemainingMs[color]}
      moveMs={snapshot.turn === color ? clock.moveRemainingMs : settings.moveTimeMs}
      showGame={settings.gameTimeMs > 0}
      showMove={settings.moveTimeMs > 0}
    />
  );

  return (
    <div
      ref={arenaRef}
      className={cn(
        'chess-arena chess-play relative -mx-4 -my-8 space-y-2 overflow-x-hidden bg-paper px-0 py-3 text-ink sm:my-0 dark:bg-[#1c1814] dark:text-[#f3ece3]',
        (fullscreen || immersive) && 'fixed inset-0 z-[80] flex flex-col overflow-auto p-0',
      )}
    >
      <div className="flex items-center gap-1.5 px-3">
        {fullscreen ? (
          <span className="inline-block h-10 w-10 shrink-0" />
        ) : (
          <Link
            to="/games"
            aria-label="Danh sách trò chơi"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xl leading-none ring-1 ring-stone-300 transition hover:bg-black/5 dark:ring-[#5c5348] dark:hover:bg-white/10"
          >
            ×
          </Link>
        )}
        {clocksOn ? <span className="flex-1" /> : <h1 className="min-w-0 flex-1 font-display text-xl">Cờ vua</h1>}
        {clocksOn ? <h1 className="sr-only">Cờ vua</h1> : null}
        <Button variant="secondary" size="icon" aria-label="Cài đặt" title="Cài đặt" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          aria-label={fullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          title={fullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          onClick={() => void toggleFullscreen()}
        >
          <FullscreenIcon expanded={fullscreen} />
        </Button>
      </div>
      {clocksOn ? (
        <div className="flex items-center justify-center gap-2 px-3">
          {clockPill(topColor, topSeat.name)}
          {clockPill(bottomColor, bottomSeat.name)}
        </div>
      ) : null}
      <div role="status" aria-live="polite" className="sr-only">
        {aiThinking ? `${thinkingName} đang suy nghĩ` : ''}
      </div>

      <div
        className={cn(
          'grid items-start gap-4',
          fullscreen ? 'lg:grid-cols-[minmax(0,1fr)_13.5rem]' : 'lg:grid-cols-[minmax(0,1fr)_14.5rem]',
        )}
      >
        <div className="space-y-2">
          <div className={cn('chess-stage', fullscreen && 'chess-stage-expanded')}>
            <div className="px-3">
              <ChessSeat
                name={topSeat.name}
                avatarId={topSeat.avatarId}
                color={topColor}
                active={!isOver && snapshot.turn === topColor}
                thinking={aiThinking && versusAi && snapshot.turn === topColor}
                size="md"
              />
            </div>
            <ChessBoard
              board={viewSnapshot.board}
              flipped={flipped}
              selected={review.reviewing ? null : selected}
              legalTargets={review.reviewing ? [] : legalTargets}
              lastMove={viewLastMove}
              checkedKing={findKingSquare(viewSnapshot)}
              disabled={boardLocked}
              expanded={fullscreen}
              boardTheme={appearance.boardTheme}
              pieceSet={appearance.pieceSet}
              onSquareClick={handleSquareClick}
            />
            <div className="grid grid-cols-[3.25rem_minmax(0,1fr)_3.25rem] items-center gap-1 px-3 pt-1">
              <HistoryButton label="Hoàn tác" disabled={!canUndo} onClick={undo} className="justify-self-start">
                <UndoIcon />
              </HistoryButton>
              <ChessSeat
                name={bottomSeat.name}
                avatarId={bottomSeat.avatarId}
                color={bottomColor}
                active={!isOver && snapshot.turn === bottomColor}
                thinking={aiThinking && versusAi && snapshot.turn === bottomColor}
                size="md"
              />
              <HistoryButton label="Làm lại" disabled={!canRedo} onClick={redo} className="justify-self-end">
                <RedoIcon />
              </HistoryButton>
            </div>
          </div>
          <div className="px-3">
          <GameStatus
            label={statusText}
            tone={statusTone}
            trailing={aiThinking && !isOver && !paused ? <ThinkingDots /> : <span className="inline-block w-[1.1em]" />}
          />
          {review.reviewing ? (
            <p className="text-center text-sm text-stone-500 dark:text-[#cbbda8]">
              Đang xem lại ván.{' '}
              <button type="button" className="font-medium text-brand hover:underline" onClick={review.goLast}>
                Tiếp tục chơi
              </button>
            </p>
          ) : null}
          {versusAi && canChangeAiLevel ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {AI_LEVELS.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => chooseAiLevel(level.id)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                    settings.aiLevel === level.id
                      ? 'bg-brand text-white ring-brand'
                      : 'bg-white text-stone-600 ring-stone-300 hover:bg-stone-50 dark:bg-[#2c261f] dark:text-[#e8ddd0] dark:ring-[#5c5348] dark:hover:bg-[#3a322a]',
                  )}
                >
                  {level.label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="secondary"
              className="px-3 py-2"
              onClick={() => (matchStarted || history.length || versusAi ? setConfirmReset(true) : resetGame())}
            >
              Ván mới
            </Button>
            <Button variant="secondary" className="px-3 py-2" onClick={() => setFlipped((value) => !value)}>
              Lật bàn
            </Button>
            {clocksOn ? (
              <Button variant="secondary" className="px-3 py-2" onClick={() => setPaused((value) => !value)} disabled={isOver}>
                {paused ? 'Tiếp tục' : 'Tạm dừng'}
              </Button>
            ) : null}
            <Button variant="ghost" className="px-3 py-2" onClick={() => setShowGuide((value) => !value)}>
              {showGuide ? 'Ẩn hướng dẫn' : 'Hướng dẫn'}
            </Button>
          </div>
          {showGuide ? (
            <div className="cheslax-panel rounded-2xl p-4 text-sm leading-6 text-stone-600 dark:text-[#d8cbb8]">
              <h2 className="font-semibold text-ink dark:text-[#f3ece3]">Cách chơi nhanh</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Chọn quân của bên đến lượt, rồi chọn ô hợp lệ được tô sáng.</li>
                <li>Mũi tên trái/phải xem lại từng nước. Đang xem lại thì không đánh được — bấm Tiếp tục chơi để về nước mới nhất.</li>
                <li>Đấu với máy có 3 mức Dễ, Vừa, Khó. Chọn mức khi bắt đầu ván; không đổi được giữa trận.</li>
                <li>Đồng hồ tổng đếm ngược cho cả ván của mỗi bên; đồng hồ nước đi reset sau mỗi nước.</li>
                <li>Đấu với máy tính điểm Elo trên thiết bị. Hai người trên cùng máy không tính xếp hạng.</li>
              </ul>
            </div>
          ) : null}
          </div>
        </div>
        <aside className="space-y-3 px-3">
          <details className="cheslax-panel rounded-2xl lg:hidden">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Lịch sử & Elo</summary>
            <div className="space-y-3 px-3 pb-3">
              <GameRatingPanel
                rating={chessRating}
                gameLabel="Elo cờ vua"
                ratedMatch={versusAi}
                opponentName={versusAi ? chessAiOpponentName(settings.aiLevel) : undefined}
                opponentRating={versusAi ? CHESS_AI_RATINGS[settings.aiLevel] : undefined}
              />
              <ChessMoveList moves={history} ply={review.ply} onPlyChange={review.setPly} framed={false} />
            </div>
          </details>
          <div className="hidden space-y-3 lg:block">
            <details className="cheslax-panel rounded-2xl">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Elo</summary>
              <div className="px-3 pb-3">
                <GameRatingPanel
                  rating={chessRating}
                  gameLabel="Elo cờ vua"
                  ratedMatch={versusAi}
                  opponentName={versusAi ? chessAiOpponentName(settings.aiLevel) : undefined}
                  opponentRating={versusAi ? CHESS_AI_RATINGS[settings.aiLevel] : undefined}
                />
              </div>
            </details>
            <ChessMoveList moves={history} ply={review.ply} onPlyChange={review.setPly} />
          </div>
        </aside>
      </div>

      {paused && !isOver ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex justify-center">
          <p className="rounded-full bg-stone-900/85 px-4 py-2 text-sm font-medium text-white shadow-lg">
            Đồng hồ đang tạm dừng
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

function ThinkingDots() {
  return (
    <span className="ai-ellipsis" aria-hidden>
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </span>
  );
}

function HistoryButton({
  label,
  disabled,
  onClick,
  children,
  className,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-stone-300 transition',
        'text-ink hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        'disabled:cursor-not-allowed disabled:opacity-45',
        'dark:text-[#f3ece3] dark:ring-[#6b6156] dark:hover:bg-white/10',
        className,
      )}
    >
      {children}
    </button>
  );
}

function seatIdentity(
  color: 'w' | 'b',
  settings: ChessPlaySettings,
  me: { name: string; avatarId: string },
): { name: string; avatarId: string } {
  if (settings.opponent === 'ai') {
    if (color === settings.playerColor) return { name: me.name, avatarId: me.avatarId };
    const persona = aiOpponentPersona(settings.aiLevel);
    return { name: persona.name, avatarId: persona.avatarId };
  }
  return {
    name: color === 'w' ? 'Người chơi 1' : 'Người chơi 2',
    avatarId: color === 'w' ? me.avatarId : 'seal-2',
  };
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
  if (aiThinking) return `${chessAiOpponentName(settings.aiLevel)} đang suy nghĩ`;
  if (snapshot.isGameOver) return resultHeadline(settings, snapshot, null);
  if (settings.opponent === 'ai') {
    const yourTurn = snapshot.turn === settings.playerColor;
    const opponent = chessAiOpponentName(settings.aiLevel);
    if (snapshot.inCheck) return yourTurn ? 'Bạn đang bị chiếu' : `${opponent} đang bị chiếu`;
    return yourTurn ? 'Lượt của bạn' : `Lượt của ${opponent}`;
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
    return timedOut === settings.playerColor
      ? `${chessAiOpponentName(settings.aiLevel)} thắng — bạn hết giờ`
      : `Bạn thắng — ${chessAiOpponentName(settings.aiLevel)} hết giờ`;
  }
  if (snapshot.status === 'checkmate') {
    return snapshot.turn === settings.playerColor
      ? `${chessAiOpponentName(settings.aiLevel)} thắng — chiếu hết`
      : 'Bạn thắng — chiếu hết';
  }
  return statusLabel(snapshot.status, snapshot.turn);
}
