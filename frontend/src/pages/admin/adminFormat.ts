export function formatWhen(value: string | null | undefined): string {
  if (!value) return '—';
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(parsed);
}

export function gameLabel(gameId: string): string {
  if (gameId === 'o-an-quan') return 'Ô ăn quan';
  if (gameId === 'chess') return 'Cờ vua';
  return gameId;
}

export function modeLabel(mode: string): string {
  return mode === 'ranked' ? 'Xếp hạng' : 'Thư giãn';
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'waiting':
      return 'Đang chờ';
    case 'playing':
      return 'Đang chơi';
    case 'finished':
      return 'Kết thúc';
    case 'abandoned':
      return 'Đã đóng';
    default:
      return status;
  }
}

export function outcomeLabel(outcome: string | null, opponentType: string): string {
  if (!outcome) return '—';
  if (outcome === 'draw') return 'Hòa';
  if (outcome === 'player1') return 'P1 thắng';
  if (outcome === 'player2') return opponentType === 'ai' ? 'Máy thắng' : 'P2 thắng';
  return outcome;
}
