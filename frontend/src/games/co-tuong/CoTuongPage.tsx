import { useEffect, useMemo, useRef, useState } from 'react';
import { GameBoardLayout } from '@/components/layout/GameBoardLayout';
import { GameRatingPanel } from '@/components/ranking/GameRatingPanel';
import { RatingChangeModal } from '@/components/ranking/RatingChangeModal';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GameStatus } from '@/components/ui/GameStatus';
import { PlayerInfo } from '@/components/ui/PlayerInfo';
import { ChessMoveList } from '@/games/chess/ChessMoveList';
import { aiOpponentPersona } from '@/ranking/aiOpponentPersona';
import type { RatingChange } from '@/ranking/ratingTypes';
import { useRatingStore } from '@/ranking/ratingStore';
import { useStatsStore } from '@/store/statsStore';
import { useMoveFeedback } from '@/games/moveFeedback';
import { CoTuongBoard } from './CoTuongBoard';
import { aiParamsFor, aiThinkDelayMs, chooseCoTuongMove, COTUONG_AI_RATINGS, coTuongLevelLabel } from './coTuongAi';
import {
  createInitialState,
  isGameOver,
  legalMovesFrom,
  otherSide,
  pieceAt,
  resultLabel,
  sideOf,
  statusOf,
  tryMove,
} from './coTuongEngine';
import type { CoTuongLevel, CoTuongOpponent, CoTuongSide, CoTuongState } from './coTuong.types';

interface CoTuongSettings {
  opponent: CoTuongOpponent;
  playerSide: CoTuongSide | 'random';
  level: CoTuongLevel;
}

export function CoTuongPage() {
  const [settings, setSettings] = useState<CoTuongSettings>({ opponent: 'ai', playerSide: 'r', level: 'medium' });
  const [color, setColor] = useState<CoTuongSide>('r');
  const [state, setState] = useState<CoTuongState>(createInitialState);
  const [past, setPast] = useState<CoTuongState[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [viewPly, setViewPly] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [resultOpen, setResultOpen] = useState(false);
  const [ratingChange, setRatingChange] = useState<RatingChange | null>(null);
  const [liveCue, setLiveCue] = useState({ token: 0, captured: false, check: false });
  const checkPulse = useMoveFeedback(liveCue.token, liveCue.captured, liveCue.check);
  const recordedRef = useRef(false);
  const matchIdRef = useRef(createMatchId());
  const recordResult = useStatsStore((store) => store.recordResult);
  const applyMatch = useRatingStore((store) => store.applyMatch);
  const rating = useRatingStore((store) => store.ratings['co-tuong']);
  const versusAi = settings.opponent === 'ai';
  const playerSide = color;
  const aiSide = otherSide(playerSide);
  const reviewing = viewPly < past.length;
  const display = reviewing ? past[viewPly]! : state;
  const ended = isGameOver(state);
  const legal = useMemo(
    () => (selected && !reviewing && !ended && !thinking ? legalMovesFrom(state, selected).map((move) => move.to) : []),
    [ended, reviewing, selected, state, thinking],
  );

  function resetGame(next: CoTuongSettings = settings) {
    const side = next.playerSide === 'random' ? (Math.random() < 0.5 ? 'r' : 'b') : next.playerSide;
    setSettings(next);
    setColor(side);
    setState(createInitialState());
    setPast([]);
    setSelected(null);
    setViewPly(0);
    setThinking(false);
    setFlipped(next.opponent === 'ai' && side === 'b');
    setConfirmReset(false);
    setResultOpen(false);
    setRatingChange(null);
    recordedRef.current = false;
    matchIdRef.current = createMatchId();
  }

  function commit(from: string, to: string, base: CoTuongState) {
    const applied = tryMove(base, from, to);
    if (!applied) return;
    const nextStatus = statusOf(applied.state);
    setLiveCue((current) => ({
      token: current.token + 1,
      captured: Boolean(applied.captured),
      check: nextStatus === 'check' || nextStatus === 'checkmate',
    }));
    setPast((current) => [...current, base]);
    setState(applied.state);
    setSelected(null);
    setViewPly((current) => Math.max(current, past.length) + 1);
    if (isGameOver(applied.state)) finish(applied.state);
  }

  function finish(next: CoTuongState) {
    if (recordedRef.current) return;
    recordedRef.current = true;
    const status = statusOf(next);
    const winner = status === 'draw-threefold' ? 'draw' : next.turn === 'r' ? 'b' : 'r';
    const outcome = winner === 'draw' ? 'draw' : winner === 'r' ? 'p1' : 'p2';
    recordResult('co-tuong', outcome, resultLabel(next));
    if (versusAi && winner !== 'draw') {
      const result = winner === playerSide ? 'win' : 'loss';
      const persona = aiOpponentPersona(settings.level);
      setRatingChange(
        applyMatch({
          matchId: matchIdRef.current,
          gameId: 'co-tuong',
          finished: true,
          rated: true,
          result,
          opponentRating: COTUONG_AI_RATINGS[settings.level],
          opponentName: persona.name,
        }),
      );
    } else if (versusAi && winner === 'draw') {
      const persona = aiOpponentPersona(settings.level);
      setRatingChange(
        applyMatch({
          matchId: matchIdRef.current,
          gameId: 'co-tuong',
          finished: true,
          rated: true,
          result: 'draw',
          opponentRating: COTUONG_AI_RATINGS[settings.level],
          opponentName: persona.name,
        }),
      );
    }
    setResultOpen(true);
  }

  function onSelect(square: string) {
    if (thinking || ended || reviewing) return;
    if (versusAi && state.turn !== playerSide) return;
    if (selected && legal.includes(square)) {
      commit(selected, square, state);
      return;
    }
    const piece = pieceAt(state.squares, square);
    if (piece && sideOf(piece) === state.turn) {
      setSelected((current) => (current === square ? null : square));
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
        const move = chooseCoTuongMove(state, aiParamsFor(settings.level));
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
  const status = statusOf(state);
  const statusText = thinking ? 'Máy đang tính nước...' : reviewing ? 'Đang xem lại nước đi' : resultLabel(state);
  const persona = aiOpponentPersona(settings.level);
  const tone = ended ? (status === 'draw-threefold' ? 'success' : 'warning') : status === 'check' ? 'danger' : 'neutral';

  return (
    <>
      <GameBoardLayout
        title="Cờ tướng"
        subtitle="Bàn 9×10 · quân đặt trên giao điểm"
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
                        {coTuongLevelLabel(level)}
                      </Choice>
                    ))
                  : null}
                {versusAi ? (
                  <>
                    <Choice active={color === 'r' && settings.playerSide !== 'random'} onClick={() => resetGame({ ...settings, playerSide: 'r' })}>
                      Bạn cầm Đỏ
                    </Choice>
                    <Choice active={color === 'b' && settings.playerSide !== 'random'} onClick={() => resetGame({ ...settings, playerSide: 'b' })}>
                      Bạn cầm Đen
                    </Choice>
                  </>
                ) : null}
              </div>
            ) : null}
            <CoTuongBoard
              state={display}
              selected={reviewing ? null : selected}
              legal={reviewing ? [] : legal}
              flipped={flipped}
              disabled={thinking || ended || reviewing || !yourTurn}
              checkPulse={checkPulse}
              onSelect={onSelect}
            />
          </div>
        }
        sidebar={
          <>
            <PlayerInfo
              name={versusAi ? (playerSide === 'b' ? 'Bạn · Đen' : persona.name) : 'Người chơi 2 · Đen'}
              detail={versusAi && playerSide === 'r' ? `${coTuongLevelLabel(settings.level)} · Elo ${COTUONG_AI_RATINGS[settings.level]}` : 'Đi sau'}
              active={!ended && display.turn === 'b' && !thinking}
            />
            <PlayerInfo
              name={versusAi ? (playerSide === 'r' ? 'Bạn · Đỏ' : persona.name) : 'Người chơi 1 · Đỏ'}
              detail={versusAi && playerSide === 'b' ? `${coTuongLevelLabel(settings.level)} · Elo ${COTUONG_AI_RATINGS[settings.level]}` : 'Đi trước'}
              active={!ended && display.turn === 'r' && !thinking}
            />
            <GameStatus label={statusText} tone={tone} />
            <GameRatingPanel rating={rating} gameLabel="Elo cờ tướng" ratedMatch={versusAi} />
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
                <li>Bàn 9 cột × 10 hàng, quân đặt trên giao điểm. Đỏ đi trước. Sông chia bàn; mỗi bên có cung 3×3.</li>
                <li>Tướng đi một bước ngang hoặc dọc trong cung. Hai tướng không được đối mặt trên cùng một cột nếu không có quân chặn.</li>
                <li>Sĩ đi chéo một bước trong cung. Tượng đi chéo hai bước, không qua sông, không nhảy mắt.</li>
                <li>Xe đi thẳng bất kỳ số giao điểm trống. Pháo đi như xe khi không ăn, ăn phải nhảy đúng một quân.</li>
                <li>Mã đi hình chữ L và bị cản nếu chân mã bị chiếm. Tốt đi một bước tiến; sang sông được đi ngang, không được đi lùi.</li>
                <li>Không được đi nước để tướng nhà bị chiếu. Không ăn tướng đối phương như nước thường — ván kết thúc bằng chiếu hết.</li>
                <li>Chiếu hết thắng. Hết nước đi (kể cả khi không bị chiếu) thì thua. Lặp thế cờ ba lần thì hòa. Không phân biệt chiếu hết / đuổi mã theo luật liên Á.</li>
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
        message={versusAi ? `Đối thủ ${persona.name} · mức ${coTuongLevelLabel(settings.level)}` : 'Ván hai người trên cùng thiết bị.'}
        change={ratingChange}
        unratedNote={versusAi ? undefined : 'Ván hai người trên cùng thiết bị không tính điểm xếp hạng.'}
        onPlayAgain={() => resetGame()}
        onClose={() => setResultOpen(false)}
      />
    </>
  );
}

const AI_LEVELS: CoTuongLevel[] = ['easy', 'medium', 'hard'];

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
  return `co-tuong-local-${crypto.randomUUID()}`;
}
