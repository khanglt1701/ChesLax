import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameStatus } from './GameStatus';

describe('dark mode status contrast', () => {
  it('uses high-contrast dark tokens for each tone', () => {
    const { rerender, container } = render(<GameStatus label="Lượt Trắng" tone="neutral" />);
    expect(container.firstChild).toHaveClass('dark:bg-[#3a322a]', 'dark:text-[#f3ece3]');

    rerender(<GameStatus label="Chiếu" tone="warning" />);
    expect(container.firstChild).toHaveClass('dark:text-amber-100');

    rerender(<GameStatus label="Chiếu hết" tone="danger" />);
    expect(container.firstChild).toHaveClass('dark:text-rose-100');
  });
});
