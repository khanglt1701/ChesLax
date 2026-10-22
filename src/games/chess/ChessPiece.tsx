import { useEffect, useState } from 'react';
import type { PieceSymbol } from 'chess.js';
import { cn } from '@/utils/cn';
import type { PieceSetId } from './chessAppearance';

interface ChessPieceProps {
  type: PieceSymbol;
  color: 'w' | 'b';
  set?: PieceSetId;
  moving?: boolean;
}

const TYPE_FILE: Record<PieceSymbol, string> = {
  k: 'K',
  q: 'Q',
  r: 'R',
  b: 'B',
  n: 'N',
  p: 'P',
};

const FANTASY_FILES = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'] as const;

let fantasyPreloaded = false;

function preloadFantasyPieces(): void {
  if (fantasyPreloaded || typeof Image === 'undefined') return;
  fantasyPreloaded = true;
  for (const name of FANTASY_FILES) {
    const image = new Image();
    image.src = `/pieces/fantasy/${name}.svg`;
  }
}

export function fantasyPieceSrc(color: 'w' | 'b', type: PieceSymbol): string {
  return `/pieces/fantasy/${color}${TYPE_FILE[type]}.svg`;
}

export function ChessPiece({ type, color, set = 'fantasy', moving = false }: ChessPieceProps) {
  const title = `${color === 'w' ? 'Trắng' : 'Đen'} ${pieceName(type)}`;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    preloadFantasyPieces();
  }, []);

  if (set === 'fantasy') {
    return (
      <img
        src={fantasyPieceSrc(color, type)}
        alt={title}
        draggable={false}
        className={cn('chess-piece', moving && 'chess-piece-moving')}
        style={failed ? { visibility: 'hidden' } : undefined}
        onError={() => setFailed(true)}
      />
    );
  }

  return <HomemadePiece type={type} color={color} set={set} moving={moving} title={title} />;
}

function pieceName(type: PieceSymbol): string {
  switch (type) {
    case 'k':
      return 'vua';
    case 'q':
      return 'hậu';
    case 'r':
      return 'xe';
    case 'b':
      return 'tượng';
    case 'n':
      return 'mã';
    default:
      return 'tốt';
  }
}

const PALETTES = {
  classic: {
    w: { fill: '#f7f1e6', stroke: '#3d3428', detail: '#8a7a63', shine: '#ffffff', rim: '#d7c4a3' },
    b: { fill: '#2b2620', stroke: '#111111', detail: '#6b6258', shine: '#4a433c', rim: '#1a1612' },
  },
  modern: {
    w: { fill: '#fbf7ec', stroke: '#8a6a28', detail: '#c4a056', shine: '#fffdf8', rim: '#e8d7a8' },
    b: { fill: '#161310', stroke: '#d4af37', detail: '#9a7b3c', shine: '#3d352c', rim: '#2a231c' },
  },
} as const;

function HomemadePiece({
  type,
  color,
  set,
  moving,
  title,
}: {
  type: PieceSymbol;
  color: 'w' | 'b';
  set: Exclude<PieceSetId, 'fantasy'>;
  moving: boolean;
  title: string;
}) {
  const palette = PALETTES[set][color];
  const uid = `${set}-${color}-${type}`;

  return (
    <svg
      viewBox="0 0 64 64"
      className={moving ? 'chess-piece chess-piece-moving' : 'chess-piece'}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={`body-${uid}`} x1="18" y1="8" x2="48" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={palette.shine} />
          <stop offset="42%" stopColor={palette.fill} />
          <stop offset="100%" stopColor={palette.rim} />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="58" rx="16" ry="3.2" fill="rgba(0,0,0,0.22)" />
      <g fill={`url(#body-${uid})`} stroke={palette.stroke} strokeWidth={set === 'modern' ? 1.7 : 1.45} strokeLinejoin="round">
        {renderHomemade(type, palette.detail, set)}
      </g>
    </svg>
  );
}

function renderHomemade(type: PieceSymbol, detail: string, set: 'classic' | 'modern') {
  switch (type) {
    case 'k':
      return (
        <>
          <path d="M18 52h28v4H18z" />
          <path d="M20 48c2-10 4-18 12-22 8 4 10 12 12 22z" />
          <rect x="28" y="10" width="8" height="14" rx="1.5" />
          <rect x="22" y="14" width="20" height="7" rx="1.5" />
          <path d="M32 8v6M29 11h6" fill="none" stroke={detail} strokeWidth={set === 'modern' ? 2.2 : 1.8} />
        </>
      );
    case 'q':
      return (
        <>
          <path d="M18 52h28v4H18z" />
          <path d="M21 47c1.5-14 4-22 11-26 7 4 9.5 12 11 26z" />
          <circle cx="32" cy="16" r="4.2" />
          <circle cx="20" cy="22" r="3.1" />
          <circle cx="44" cy="22" r="3.1" />
          <path d="M20 22 L32 16 L44 22" fill="none" stroke={detail} strokeWidth="1.5" />
        </>
      );
    case 'r':
      return (
        <>
          <path d="M18 52h28v4H18z" />
          <path d="M22 48h20v-18H22z" />
          <path d="M20 30h24v-6H20z" />
          <path d="M20 24h6v-8h4v5h8v-5h4v8h6" />
        </>
      );
    case 'b':
      return (
        <>
          <path d="M18 52h28v4H18z" />
          <path d="M24 48c2-12 4-20 8-26 4 6 6 14 8 26z" />
          <ellipse cx="32" cy="20" rx="7" ry="9" />
          <circle cx="32" cy="10" r="3.2" />
          <path d="M32 16v12" fill="none" stroke={detail} strokeWidth="1.7" />
        </>
      );
    case 'n':
      return (
        <>
          <path d="M18 52h28v4H18z" />
          <path d="M46 48H22c1-8 3-16 8-22 2-3-2-6-6-7 6-2 12-1 16 3 5 5 8 14 6 26z" />
          <circle cx="28" cy="24" r="1.5" fill={detail} stroke="none" />
        </>
      );
    default:
      return (
        <>
          <path d="M20 52h24v4H20z" />
          <path d="M24 48c1-10 2-16 8-18 6 2 7 8 8 18z" />
          <circle cx="32" cy="24" r="7" />
        </>
      );
  }
}
