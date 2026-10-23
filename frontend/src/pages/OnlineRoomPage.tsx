import { useEffect, useMemo, useRef, useState } from 'react';
import type { PieceSymbol, Square } from 'chess.js';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ConnectionStatus } from '@/components/online/ConnectionStatus';
import { PlayerAvatar } from '@/components/ranking/PlayerAvatar';
import { RatingChangeModal } from '@/components/ranking/RatingChangeModal';
import { Button } from '@/components/ui/Button';
import { ChessBoard } from '@/games/chess/ChessBoard';
import { ChessClockCard } from '@/games/chess/ChessClockCard';
import { ChessMoveList } from '@/games/chess/ChessMoveList';
import { PromotionDialog } from '@/games/chess/PromotionDialog';
import { loadChessAppearance } from '@/games/chess/chessAppearance';
import { getLegalMoves, getSnapshotFromFen, needsPromotion } from '@/games/chess/chessService';
import { OAnQuanBoard } from '@/games/o-an-quan/OAnQuanBoard';
import { applyVisualEvent, delay, eventDelay } from '@/games/o-an-quan/oAnQuanAnimation';
import { getValidPits, resultLabel, scoreOf, screenDirectionToEngine } from '@/games/o-an-quan/oAnQuanEngine';
import type { OAnQuanState } from '@/games/o-an-quan/oAnQuan.types';
import { onlineGameService } from '@/online/onlineGameService';
import { inviteUrl } from '@/online/playerSession';
import type { PublicSeat, RoomPublicState } from '@/online/protocol';
import { useOnlineGame } from '@/online/useOnlineGame';
import { t } from '@/i18n/t';
import { useRatingStore } from '@/ranking/ratingStore';
import { cn } from '@/utils/cn';

export function OnlineRoomPage() {
  const params = useParams();
  const code = (params.roomCode ?? params.code ?? '').toUpperCase();
  const navigate = useNavigate();
  const player = useRatingStore((state) => state.player);
  const ingestServerChange = useRatingStore((state) => state.ingestServerChange);
  const { connection, room, lastError } = useOnlineGame();
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [appearance] = useState(loadChessAppearance);
  const [selected, setSelected] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [selectedPit, setSelectedPit] = useState<number | null>(null);
  const [displayFolk, setDisplayFolk] = useState<OAnQuanState | null>(null);
  const [highlight, setHighlight] = useState<{ pit: number; kind: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const ingested = useRef<string | null>(null);
  const animatedVersion = useRef(-1);

  useEffect(() => {
    onlineGameService.rememberCode(code.toUpperCase());
    void onlineGameService.connect({ name: player.name, avatarId: player.avatarId }).then(() => {
      void onlineGameService.joinRoom(code);
    });
  }, [code, player.avatarId, player.name]);

  useEffect(() => {
    if (room?.result?.yourChange && room.status === 'ended') {
      const matchId = `online:${room.code}`;
      if (ingested.current !== matchId) {
        ingested.current = matchId;
        ingestServerChange(matchId, room.result.yourChange);
      }
    }
  }, [ingestServerChange, room]);

  useEffect(() => {
    const folk = room?.oAnQuan;
    if (!folk) return;
    if (animatedVersion.current === room.version) {
      setDisplayFolk(folk.state);
      return;
    }
    if (animatedVersion.current < 0 || folk.lastEvents.length === 0) {
      animatedVersion.current = room.version;
      setDisplayFolk(folk.state);
      return;
    }
    let cancelled = false;
    void (async () => {
      setBusy(true);
      let frame = displayFolk ?? folk.state;
      for (const event of folk.lastEvents) {
        if (cancelled) return;
        if ('pit' in event) setHighlight({ pit: event.pit, kind: event.type });
        frame = applyVisualEvent(frame, event);
        setDisplayFolk(frame);
        await delay(eventDelay(event));
      }
      if (!cancelled) {
        setHighlight(null);
        setDisplayFolk(folk.state);
        animatedVersion.current = room.version;
        setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [room?.oAnQuan, room?.version]);

  const snapshot = useMemo(
    () => (room?.chess ? getSnapshotFromFen(room.chess.fen) : null),
    [room?.chess],
  );

  async function copy(kind: 'code' | 'link') {
    const roomCode = (room?.code ?? code).toUpperCase();
    const text = kind === 'code' ? roomCode : inviteUrl(roomCode, room?.game ?? 'chess');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  if (!room) {
    return (
      <div className="space-y-4">
        <ConnectionStatus status={connection} />
        <p className="text-sm text-stone-500">{lastError ?? 'Đang vào phòng...'}</p>
        <Button variant="secondary" onClick={() => navigate('/games')}>
          Về sảnh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to={lobbyPath(room)} className="text-sm font-medium text-brand hover:underline">
            ← Sảnh online
          </Link>
          <h1 className="mt-1 font-display text-3xl">{room.game === 'chess' ? 'Cờ vua online' : 'Ô ăn quan online'}</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            {room.mode === 'ranked' ? t('play.rankedBadge') : t('play.casualBadge')}
          </p>
          {room.opponentType === 'ai' ? (
            <p className="mt-1 text-sm font-medium text-stone-600 dark:text-stone-300">
              {t('play.aiOpponent')}
              {room.aiDifficultyLabel ? ` · ${t('play.aiDifficulty')} ${room.aiDifficultyLabel}` : ''}
            </p>
          ) : null}
          {room.mode === 'ranked' ? null : <p className="mt-1 font-mono text-lg tracking-[0.18em]">{room.code}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ConnectionStatus status={connection} />
          {room.mode === 'ranked' ? null : (
            <>
              <Button variant="secondary" onClick={() => void copy('code')}>
                {copied === 'code' ? 'Đã chép mã' : 'Sao chép mã'}
              </Button>
              <Button variant="secondary" onClick={() => void copy('link')}>
                {copied === 'link' ? 'Đã chép link' : 'Sao chép link mời'}
              </Button>
            </>
          )}
        </div>
      </div>

      {lastError ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
          {lastError}
        </p>
      ) : null}

      {room.waiting ? (
        <p className="rounded-2xl bg-brand/10 px-4 py-3 text-sm text-stone-700 dark:text-stone-200">
          Đang chờ đối thủ. Gửi mã <strong>{room.code}</strong> hoặc đường dẫn mời. Ván chỉ bắt đầu khi đủ hai người.
        </p>
      ) : null}

      {room.disconnectDeadline && room.status === 'playing' ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Đối thủ mất kết nối. Đang chờ họ vào lại phòng này — không tạo ván mới.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {room.seats.map((seat) => (
          <SeatCard key={seat.playerId} seat={seat} you={room.you?.playerId === seat.playerId} room={room} />
        ))}
        {room.seats.length < 2 ? (
          <div className="rounded-2xl px-4 py-3 text-sm text-stone-500 ring-1 ring-dashed ring-stone-300">
            Chỗ trống — chờ người chơi thứ hai
          </div>
        ) : null}
      </div>

      {room.game === 'chess' && snapshot && room.chess ? (
        <OnlineChess
          room={room}
          snapshot={snapshot}
          appearance={appearance}
          selected={selected}
          setSelected={setSelected}
          pendingPromotion={pendingPromotion}
          setPendingPromotion={setPendingPromotion}
        />
      ) : null}

      {room.game === 'o-an-quan' && room.oAnQuan ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <OAnQuanBoard
            pits={(displayFolk ?? room.oAnQuan.state).pits}
            currentPlayer={(displayFolk ?? room.oAnQuan.state).currentPlayer}
            selectedPit={selectedPit}
            validPits={
              busy ||
              room.status !== 'playing' ||
              typeof room.you?.side !== 'number' ||
              room.you.side !== room.oAnQuan.state.currentPlayer
                ? []
                : getValidPits(room.oAnQuan.state, room.you.side)
            }
            highlight={highlight}
            disabled={busy || room.status !== 'playing' || room.you?.side !== room.oAnQuan.state.currentPlayer}
            playerNames={[
              room.seats.find((seat) => seat.side === 0)?.name ?? 'Người chơi 1',
              room.seats.find((seat) => seat.side === 1)?.name ?? 'Người chơi 2',
            ]}
            onSelectPit={(index) => setSelectedPit((current) => (current === index ? null : index))}
            onChooseDirection={(screen) => {
              if (selectedPit === null || !room.you || typeof room.you.side !== 'number') return;
              const direction = screenDirectionToEngine(selectedPit, screen);
              setSelectedPit(null);
              void onlineGameService.oAnQuanMove({ pit: selectedPit, direction, version: room.version });
            }}
          />
          <aside className="space-y-3">
            <p className="rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
              {room.status === 'ended'
                ? resultLabel(room.oAnQuan.state)
                : busy
                  ? 'Đang rải quân...'
                  : `Lượt ${room.oAnQuan.state.currentPlayer === 0 ? 'Người chơi 1' : 'Người chơi 2'}`}
            </p>
            <p className="text-xs text-stone-500">
              Điểm: {scoreOf(room.oAnQuan.state.captured[0])} — {scoreOf(room.oAnQuan.state.captured[1])}
            </p>
          </aside>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {room.status === 'playing' ? (
          <Button variant="danger" onClick={() => void onlineGameService.resign()}>
            Đầu hàng
          </Button>
        ) : null}
        <Button
          variant="secondary"
          onClick={() => {
            void onlineGameService.leave();
            navigate(lobbyPath(room));
          }}
        >
          Rời phòng
        </Button>
      </div>

      <RatingChangeModal
        open={room.status === 'ended'}
        title={room.result?.reason ?? 'Ván đã kết thúc'}
        message={
          room.result?.rated
            ? 'Elo được máy chủ cập nhật.'
            : room.mode === 'ranked'
              ? 'Ván xếp hạng này không đủ điều kiện thay đổi Elo.'
              : 'Ván Casual không tính Elo.'
        }
        change={room.result?.yourChange ?? null}
        authoritative={Boolean(room.result?.rated)}
        opponentType={room.result?.opponentType ?? room.opponentType}
        aiDifficultyLabel={room.result?.aiDifficultyLabel ?? room.aiDifficultyLabel}
        unratedNote={
          room.result?.rated
            ? undefined
            : room.mode === 'ranked'
              ? 'Kết quả chưa được ghi nhận là ván xếp hạng hợp lệ.'
              : 'Casual không cộng hoặc trừ Elo.'
        }
        onPlayAgain={() => navigate(room.mode === 'ranked' ? `/games/${room.game}/ranked` : lobbyPath(room))}
        onClose={() => undefined}
      />
    </div>
  );
}

function lobbyPath(room: Pick<RoomPublicState, 'game'>): string {
  return `/games/${room.game}/online`;
}

function SeatCard({ seat, you, room }: { seat: PublicSeat; you: boolean; room: RoomPublicState }) {
  const sideLabel =
    room.game === 'chess' ? (seat.side === 'w' ? 'Trắng' : 'Đen') : seat.side === 0 ? 'Hàng dưới' : 'Hàng trên';
  const turn =
    room.game === 'chess'
      ? room.chess?.turn === seat.side
      : room.oAnQuan?.state.currentPlayer === seat.side;
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl px-3 py-3 ring-1',
        turn && room.status === 'playing' ? 'ring-brand bg-brand/10' : 'ring-stone-200 dark:ring-stone-700',
      )}
    >
      <PlayerAvatar avatarId={seat.avatarId} name={seat.name} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {seat.name} {you ? '(Bạn)' : ''}
        </p>
        <p className="text-xs text-stone-500">
          {seat.isAi || (room.opponentType === 'ai' && !you)
            ? `${sideLabel} · ${t('play.aiOpponent')}`
            : `${sideLabel} · ${seat.connected ? 'Đang online' : 'Mất kết nối'}`}
        </p>
      </div>
    </div>
  );
}

function OnlineChess({
  room,
  snapshot,
  appearance,
  selected,
  setSelected,
  pendingPromotion,
  setPendingPromotion,
}: {
  room: RoomPublicState;
  snapshot: ReturnType<typeof getSnapshotFromFen>;
  appearance: ReturnType<typeof loadChessAppearance>;
  selected: Square | null;
  setSelected: (square: Square | null) => void;
  pendingPromotion: { from: Square; to: Square } | null;
  setPendingPromotion: (value: { from: Square; to: Square } | null) => void;
}) {
  const yourSide = room.you?.side === 'w' || room.you?.side === 'b' ? room.you.side : null;
  const myTurn = room.status === 'playing' && snapshot.turn === yourSide;
  const legalTargets = selected && myTurn ? getLegalMoves(room.chess!.fen, selected).map((move) => move.to) : [];
  const flipped = yourSide === 'b';
  const king = snapshot.inCheck
    ? snapshot.board.flat().find((cell) => cell.piece?.type === 'k' && cell.piece.color === snapshot.turn)?.square ??
      null
    : null;

  function handleSquareClick(square: Square) {
    if (!myTurn || !room.chess || !yourSide) return;
    const piece = snapshot.board.flat().find((cell) => cell.square === square)?.piece;
    if (selected && legalTargets.includes(square)) {
      if (needsPromotion(room.chess.fen, selected, square)) {
        setPendingPromotion({ from: selected, to: square });
        return;
      }
      void onlineGameService.chessMove({ from: selected, to: square, version: room.version });
      setSelected(null);
      return;
    }
    if (piece?.color === yourSide) setSelected(square);
    else setSelected(null);
  }

  const whiteSeat = room.seats.find((seat) => seat.side === 'w');
  const blackSeat = room.seats.find((seat) => seat.side === 'b');
  const clocks = room.chess?.clocks;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div className="space-y-3">
        {clocks ? (
          <ChessClockCard
            name={flipped ? (whiteSeat?.name ?? 'Trắng') : (blackSeat?.name ?? 'Đen')}
            color={flipped ? 'w' : 'b'}
            active={snapshot.turn === (flipped ? 'w' : 'b') && room.status === 'playing'}
            gameMs={flipped ? clocks.w : clocks.b}
            moveMs={0}
            showGame
            showMove={false}
            compact
          />
        ) : null}
        <ChessBoard
          board={snapshot.board}
          flipped={flipped}
          selected={selected}
          legalTargets={legalTargets}
          lastMove={room.chess?.lastMove ?? null}
          checkedKing={king}
          disabled={!myTurn}
          boardTheme={appearance.boardTheme}
          pieceSet={appearance.pieceSet}
          onSquareClick={handleSquareClick}
        />
        {clocks ? (
          <ChessClockCard
            name={flipped ? (blackSeat?.name ?? 'Đen') : (whiteSeat?.name ?? 'Trắng')}
            color={flipped ? 'b' : 'w'}
            active={snapshot.turn === (flipped ? 'b' : 'w') && room.status === 'playing'}
            gameMs={flipped ? clocks.b : clocks.w}
            moveMs={0}
            showGame
            showMove={false}
            compact
          />
        ) : (
          <p className="text-center text-xs text-stone-500">Ván không giới hạn thời gian — đồng hồ không chạy.</p>
        )}
      </div>
      <ChessMoveList moves={room.chess?.history ?? []} />
      <PromotionDialog
        open={Boolean(pendingPromotion)}
        color={snapshot.turn}
        pieceSet={appearance.pieceSet}
        onSelect={(piece: PieceSymbol) => {
          if (!pendingPromotion) return;
          void onlineGameService.chessMove({
            from: pendingPromotion.from,
            to: pendingPromotion.to,
            promotion: piece === 'q' || piece === 'r' || piece === 'b' || piece === 'n' ? piece : 'q',
            version: room.version,
          });
          setPendingPromotion(null);
          setSelected(null);
        }}
        onCancel={() => setPendingPromotion(null)}
      />
    </div>
  );
}
