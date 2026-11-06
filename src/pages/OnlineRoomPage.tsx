import { useState } from 'react';
import type { Square } from 'chess.js';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ConnectionStatus } from '@/components/online/ConnectionStatus';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { readState, seatLabel, viewerFlips, type GameAction, type OnlineGameId } from '@/features/multiplayer/gameSync';
import { useOnlineRoom } from '@/features/multiplayer/hooks/useOnlineRoom';
import { CaroBoard } from '@/games/caro/CaroBoard';
import type { CaroState } from '@/games/caro/caroEngine';
import { CoGanhBoard } from '@/games/co-ganh/CoGanhBoard';
import { getLegalMoves as coGanhMoves } from '@/games/co-ganh/coGanhEngine';
import type { CoGanhState } from '@/games/co-ganh/coGanh.types';
import { CoTuongBoard } from '@/games/co-tuong/CoTuongBoard';
import { legalMovesFrom } from '@/games/co-tuong/coTuongEngine';
import type { CoTuongState } from '@/games/co-tuong/coTuong.types';
import { ChessBoard } from '@/games/chess/ChessBoard';
import { PromotionDialog } from '@/games/chess/PromotionDialog';
import { loadChessAppearance } from '@/games/chess/chessAppearance';
import { getLegalMoves, getSnapshotFromFen, needsPromotion } from '@/games/chess/chessService';
import { OAnQuanBoard } from '@/games/o-an-quan/OAnQuanBoard';
import { getValidPits, screenDirectionToEngine } from '@/games/o-an-quan/oAnQuanEngine';
import type { OAnQuanState } from '@/games/o-an-quan/oAnQuan.types';
import { joinRoom, leaveRoom, restartMatch, startMatch, submitMove } from '@/services/firebase/roomService';
import { DEFAULT_PLAYERS, shownName, usePlayerStore } from '@/store/playerStore';

export function OnlineRoomPage() {
  const params = useParams();
  const code = (params.roomCode ?? '').toUpperCase();
  const navigate = useNavigate();
  const storedName = usePlayerStore((state) => shownName(state.players.player1, DEFAULT_PLAYERS.player1));
  const { room, uid, link, error, setError, ready } = useOnlineRoom(code);
  const [nickname, setNickname] = useState(storedName);
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const me = uid ? room?.players[uid] : undefined;
  const opponent = Object.entries(room?.players ?? {}).find(([id]) => id !== uid)?.[1];
  const game = room?.metadata.gameType;
  const myTurn = Boolean(room?.game && me && room.game.status === 'playing' && room.game.turn === me.seat);
  const invite = `${window.location.origin}/play/${room?.metadata.gameType ?? 'room'}/${code}`;

  async function enter() {
    setBusy(true);
    setError(null);
    try {
      await joinRoom(code, nickname.trim() || DEFAULT_PLAYERS.player1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không vào được phòng.');
    } finally {
      setBusy(false);
    }
  }

  async function play(action: GameAction) {
    if (!room || !me || busy) return;
    setBusy(true);
    setError(null);
    try {
      await submitMove(code, room, action, me.seat);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nước đi không được chấp nhận.');
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    if (!room) return;
    setBusy(true);
    setError(null);
    try {
      await startMatch(code, room);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không bắt đầu được.');
    } finally {
      setBusy(false);
    }
  }

  async function restart() {
    if (!room) return;
    setConfirmRestart(false);
    setBusy(true);
    try {
      await restartMatch(code, room);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không chơi lại được.');
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    setConfirmLeave(false);
    if (uid) await leaveRoom(code, room, uid);
    navigate(game ? `/games/${game}/online` : '/games');
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to={game ? `/games/${game}/online` : '/games'} className="text-sm font-medium text-brand hover:underline">
            ← Sảnh hai máy
          </Link>
          <h1 className="mt-1 font-display text-3xl">{game ? titleOf(game) : 'Phòng chơi'}</h1>
          <p className="mt-1 font-mono text-lg tracking-[0.18em]">{code}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ConnectionStatus status={link} />
          <Button variant="secondary" onClick={() => void navigator.clipboard.writeText(code)}>
            Sao chép mã
          </Button>
          <Button variant="secondary" onClick={() => void navigator.clipboard.writeText(invite)}>
            Sao chép link
          </Button>
        </div>
      </div>

      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-200">{error}</p> : null}
      {!ready ? <p className="text-sm text-stone-500">Đang mở phòng...</p> : null}

      {ready && room && !me ? (
        <section className="rounded-3xl bg-white p-5 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
          <h2 className="font-display text-2xl">Vào phòng</h2>
          <label className="mt-4 block">
            <span className="text-sm font-medium">Biệt danh</span>
            <input
              value={nickname}
              maxLength={24}
              onChange={(event) => setNickname(event.target.value)}
              className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 outline-none ring-brand focus:ring-2 dark:border-stone-600 dark:bg-stone-800"
            />
          </label>
          <Button className="mt-4" disabled={busy} onClick={() => void enter()}>
            Tham gia
          </Button>
        </section>
      ) : null}

      {room ? (
        <section className="grid gap-3 sm:grid-cols-2">
          {Object.entries(room.players).map(([id, player]) => (
            <article key={id} className="rounded-2xl bg-white px-4 py-3 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
              <p className="font-semibold">
                {player.nickname}
                {id === uid ? ' (Bạn)' : ''}
                {id === room.metadata.hostId ? ' · Chủ phòng' : ''}
              </p>
              <p className="text-sm text-stone-500">
                {seatLabel(room.metadata.gameType, player.seat)} · {player.connected ? 'Đang online' : 'Mất kết nối'}
              </p>
            </article>
          ))}
        </section>
      ) : null}

      {room?.metadata.status === 'waiting' ? (
        <p className="text-sm text-stone-600 dark:text-stone-300">
          {Object.keys(room.players).length < 2
            ? 'Đang chờ người thứ hai. Gửi mã hoặc link mời.'
            : uid === room.metadata.hostId
              ? 'Đủ hai người. Bạn có thể bắt đầu.'
              : 'Đang chờ chủ phòng bắt đầu.'}
        </p>
      ) : null}
      {room?.metadata.status === 'abandoned' ? <p className="text-sm text-rose-700">Chủ phòng đã đóng phòng này.</p> : null}
      {opponent && room?.game?.status === 'playing' && !opponent.connected ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Đối thủ đang mất kết nối. Họ có thể vào lại bằng cùng link.</p>
      ) : null}
      {room?.game?.status === 'ended' ? (
        <p className="rounded-2xl bg-teal-50 px-4 py-3 text-sm text-teal-900">{room.game.result || 'Ván đã kết thúc'}</p>
      ) : null}

      {room && game && room.game && room.metadata.status === 'playing' ? (
        <OnlineTable game={game} state={room.game.state} seat={me?.seat ?? null} disabled={!myTurn || busy || link !== 'connected'} onMove={(action) => void play(action)} />
      ) : null}

      <div className="flex flex-wrap gap-2">
        {room && uid === room.metadata.hostId && room.metadata.status === 'waiting' ? (
          <Button disabled={busy || Object.keys(room.players).length < 2} onClick={() => void start()}>
            Bắt đầu
          </Button>
        ) : null}
        {room && uid === room.metadata.hostId && room.game ? (
          <Button variant="secondary" disabled={busy} onClick={() => setConfirmRestart(true)}>
            Chơi lại
          </Button>
        ) : null}
        <Button variant="secondary" onClick={() => setConfirmLeave(true)}>
          Rời phòng
        </Button>
      </div>

      <ConfirmDialog
        open={confirmLeave}
        title="Rời phòng?"
        message="Bạn sẽ rời khỏi phòng này. Nếu bạn là chủ phòng, phòng sẽ đóng."
        confirmLabel="Rời phòng"
        cancelLabel="Ở lại"
        onConfirm={() => void leave()}
        onCancel={() => setConfirmLeave(false)}
      />
      <ConfirmDialog
        open={confirmRestart}
        title="Chơi lại?"
        message="Bàn sẽ trở về thế cờ ban đầu cho cả hai máy."
        confirmLabel="Chơi lại"
        cancelLabel="Huỷ"
        onConfirm={() => void restart()}
        onCancel={() => setConfirmRestart(false)}
      />
    </div>
  );
}

function titleOf(game: OnlineGameId): string {
  if (game === 'chess') return 'Cờ vua hai máy';
  if (game === 'caro') return 'Caro hai máy';
  if (game === 'co-tuong') return 'Cờ tướng hai máy';
  if (game === 'co-ganh') return 'Cờ Gánh hai máy';
  return 'Ô ăn quan hai máy';
}

function OnlineTable({
  game,
  state,
  seat,
  disabled,
  onMove,
}: {
  game: OnlineGameId;
  state: string;
  seat: string | null;
  disabled: boolean;
  onMove: (action: GameAction) => void;
}) {
  if (game === 'chess') return <ChessTable state={state} seat={seat} disabled={disabled} onMove={onMove} />;
  if (game === 'caro') return <CaroTable state={state} disabled={disabled} onMove={onMove} />;
  if (game === 'co-tuong') return <CoTuongTable state={state} seat={seat} disabled={disabled} onMove={onMove} />;
  if (game === 'co-ganh') return <CoGanhTable state={state} seat={seat} disabled={disabled} onMove={onMove} />;
  return <FolkTable state={state} disabled={disabled} onMove={onMove} />;
}

function ChessTable({ state, seat, disabled, onMove }: { state: string; seat: string | null; disabled: boolean; onMove: (action: GameAction) => void }) {
  const parsed = readState<{ fen: string; lastFrom: Square | null; lastTo: Square | null }>({ state, turn: '', status: 'playing', result: '', version: 0, actor: '' });
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const appearance = loadChessAppearance();
  if (!parsed?.fen) return <p>Không đọc được bàn cờ.</p>;
  const snapshot = getSnapshotFromFen(parsed.fen);
  const legal = selected ? getLegalMoves(parsed.fen, selected).map((move) => move.to) : [];
  const checked = snapshot.inCheck
    ? snapshot.board.flat().find((cell) => cell.piece?.type === 'k' && cell.piece.color === snapshot.turn)?.square ?? null
    : null;

  function choose(square: Square) {
    if (disabled) return;
    if (selected && legal.includes(square)) {
      if (needsPromotion(parsed!.fen, selected, square)) {
        setPromotion({ from: selected, to: square });
        return;
      }
      onMove({ game: 'chess', from: selected, to: square });
      setSelected(null);
      return;
    }
    const piece = snapshot.board.flat().find((cell) => cell.square === square)?.piece;
    setSelected(piece && piece.color === snapshot.turn ? square : null);
  }

  return (
    <>
      <ChessBoard
        board={snapshot.board}
        flipped={viewerFlips('chess', seat)}
        selected={selected}
        legalTargets={legal}
        lastMove={parsed.lastFrom && parsed.lastTo ? { from: parsed.lastFrom, to: parsed.lastTo } : null}
        checkedKing={checked}
        disabled={disabled}
        boardTheme={appearance.boardTheme}
        pieceSet={appearance.pieceSet}
        onSquareClick={choose}
      />
      <PromotionDialog
        open={Boolean(promotion)}
        color={snapshot.turn}
        pieceSet={appearance.pieceSet}
        onCancel={() => setPromotion(null)}
        onSelect={(piece) => {
          if (!promotion) return;
          onMove({ game: 'chess', from: promotion.from, to: promotion.to, promotion: piece });
          setPromotion(null);
          setSelected(null);
        }}
      />
    </>
  );
}

function CaroTable({ state, disabled, onMove }: { state: string; disabled: boolean; onMove: (action: GameAction) => void }) {
  const parsed = readState<CaroState>({ state, turn: '', status: 'playing', result: '', version: 0, actor: '' });
  if (!parsed) return <p>Không đọc được bàn caro.</p>;
  return (
    <CaroBoard
      cells={parsed.cells}
      size={parsed.size}
      turn={parsed.turn}
      lastIndex={parsed.lastIndex}
      winningLine={parsed.winningLine}
      disabled={disabled || parsed.status !== 'playing'}
      onPlace={(index) => onMove({ game: 'caro', index })}
    />
  );
}

function CoTuongTable({ state, seat, disabled, onMove }: { state: string; seat: string | null; disabled: boolean; onMove: (action: GameAction) => void }) {
  const parsed = readState<CoTuongState>({ state, turn: '', status: 'playing', result: '', version: 0, actor: '' });
  const [selected, setSelected] = useState<string | null>(null);
  if (!parsed) return <p>Không đọc được bàn cờ tướng.</p>;
  const legal = selected ? legalMovesFrom(parsed, selected).map((move) => move.to) : [];
  return (
    <CoTuongBoard
      state={parsed}
      selected={selected}
      legal={legal}
      flipped={viewerFlips('co-tuong', seat)}
      disabled={disabled}
      onSelect={(square) => {
        if (disabled) return;
        if (selected && legal.includes(square)) {
          onMove({ game: 'co-tuong', from: selected, to: square });
          setSelected(null);
          return;
        }
        setSelected(selected === square ? null : square);
      }}
    />
  );
}

function CoGanhTable({ state, seat, disabled, onMove }: { state: string; seat: string | null; disabled: boolean; onMove: (action: GameAction) => void }) {
  const parsed = readState<CoGanhState>({ state, turn: '', status: 'playing', result: '', version: 0, actor: '' });
  const [selected, setSelected] = useState<number | null>(null);
  if (!parsed) return <p>Không đọc được bàn cờ gánh.</p>;
  const legal = selected == null ? [] : coGanhMoves(parsed, selected).map((move) => move.to);
  return (
    <CoGanhBoard
      state={parsed}
      selected={selected}
      legal={legal}
      flipped={viewerFlips('co-ganh', seat)}
      disabled={disabled}
      onSelect={(index) => {
        if (disabled) return;
        if (selected != null && legal.includes(index)) {
          onMove({ game: 'co-ganh', from: selected, to: index });
          setSelected(null);
          return;
        }
        setSelected(selected === index ? null : index);
      }}
    />
  );
}

function FolkTable({ state, disabled, onMove }: { state: string; disabled: boolean; onMove: (action: GameAction) => void }) {
  const parsed = readState<OAnQuanState>({ state, turn: '', status: 'playing', result: '', version: 0, actor: '' });
  const [selected, setSelected] = useState<number | null>(null);
  if (!parsed) return <p>Không đọc được bàn ô ăn quan.</p>;
  const valid = getValidPits(parsed);
  return (
    <OAnQuanBoard
      pits={parsed.pits}
      currentPlayer={parsed.currentPlayer}
      selectedPit={selected}
      validPits={disabled ? [] : valid}
      highlight={null}
      disabled={disabled}
      onSelectPit={(index) => setSelected(selected === index ? null : index)}
      onChooseDirection={(screen) => {
        if (selected == null || disabled) return;
        onMove({ game: 'o-an-quan', pit: selected, direction: screenDirectionToEngine(selected, screen) });
        setSelected(null);
      }}
    />
  );
}
