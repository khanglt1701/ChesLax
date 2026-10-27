import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChessBoard } from './ChessBoard';
import { getSnapshotFromFen, startingFen } from './chessService';

describe('ChessBoard presentation', () => {
  it('does not render rank or file coordinate labels', () => {
    const snapshot = getSnapshotFromFen(startingFen());
    render(
      <ChessBoard
        board={snapshot.board}
        selected={null}
        legalTargets={[]}
        lastMove={null}
        checkedKing={null}
        onSquareClick={vi.fn()}
      />,
    );

    expect(document.querySelector('.chess-rank-labels')).toBeNull();
    expect(document.querySelector('.chess-file-labels')).toBeNull();
    expect(screen.queryByText('a')).toBeNull();
    expect(screen.queryByText('h')).toBeNull();
    expect(screen.getByTestId('chess-board')).toBeInTheDocument();
    expect(screen.getByLabelText('Ô e2, trắng p')).toBeInTheDocument();
  });

  it('keeps white at the bottom and still handles square clicks', () => {
    const snapshot = getSnapshotFromFen(startingFen());
    const onSquareClick = vi.fn();
    render(
      <ChessBoard
        board={snapshot.board}
        selected={null}
        legalTargets={[]}
        lastMove={null}
        checkedKing={null}
        onSquareClick={onSquareClick}
      />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]?.getAttribute('aria-label')).toContain('a8');
    expect(buttons[buttons.length - 1]?.getAttribute('aria-label')).toContain('h1');

    const e2 = buttons.find((button) => button.getAttribute('aria-label') === 'Ô e2, trắng p');
    e2?.click();
    expect(onSquareClick).toHaveBeenCalledWith('e2');
  });
});
