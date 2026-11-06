import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CoTuongBoard } from './CoTuongBoard';
import { createInitialState } from './coTuongEngine';

describe('CoTuongBoard', () => {
  it('places red at the bottom and exposes accessible piece labels', () => {
    const onSelect = vi.fn();
    render(
      <CoTuongBoard state={createInitialState()} selected={null} legal={[]} onSelect={onSelect} />,
    );

    expect(screen.getByTestId('cotuong-board')).toBeInTheDocument();
    expect(screen.getByLabelText('Tướng đỏ e0')).toBeInTheDocument();
    expect(screen.getByLabelText('Tướng đen e9')).toBeInTheDocument();

    screen.getByLabelText('Tốt đỏ a3').click();
    expect(onSelect).toHaveBeenCalledWith('a3');
  });

  it('keeps river labels visible', () => {
    render(<CoTuongBoard state={createInitialState()} selected={null} legal={[]} onSelect={vi.fn()} />);
    expect(screen.getByText('楚 河')).toBeInTheDocument();
    expect(screen.getByText('漢 界')).toBeInTheDocument();
  });
});
