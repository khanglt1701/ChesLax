import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CoGanhBoard } from './CoGanhBoard.tsx';
import { createInitialState } from './coGanhEngine';

describe('CoGanhBoard', () => {
  it('places red on the home rank and exposes accessible labels', () => {
    const onSelect = vi.fn();
    render(<CoGanhBoard state={createInitialState()} selected={null} legal={[]} onSelect={onSelect} />);

    expect(screen.getByTestId('co-ganh-board')).toBeInTheDocument();
    expect(screen.getByLabelText('Quân Đỏ a1')).toBeInTheDocument();
    expect(screen.getByLabelText('Quân Xanh e5')).toBeInTheDocument();
    expect(screen.getByLabelText('Giao điểm c3')).toBeInTheDocument();

    screen.getByLabelText('Quân Đỏ c1').click();
    expect(onSelect).toHaveBeenCalled();
  });
});
