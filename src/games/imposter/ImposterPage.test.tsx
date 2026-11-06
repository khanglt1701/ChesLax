import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { ImposterPage } from './ImposterPage';

describe('màn chuyền điện thoại', () => {
  beforeEach(() => sessionStorage.clear());

  it('chỉ hiện từ khi đang nhấn giữ và không quay lại người trước', () => {
    render(
      <MemoryRouter>
        <ImposterPage random={() => 0.999} />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Tên người 1'), { target: { value: 'An' } });
    fireEvent.change(screen.getByLabelText('Tên người 2'), { target: { value: 'Bình' } });
    fireEvent.change(screen.getByLabelText('Tên người 3'), { target: { value: 'Chi' } });
    fireEvent.change(screen.getByLabelText('Chủ đề'), { target: { value: 'animals' } });
    fireEvent.change(screen.getByLabelText('Độ khó'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu ván chơi' }));

    expect(screen.getByText('Đến lượt bạn')).toBeInTheDocument();
    expect(screen.getByText('An')).toBeInTheDocument();
    expect(screen.queryByText('Gà')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /người trước/i })).not.toBeInTheDocument();

    const hold = screen.getByRole('button', { name: 'Nhấn giữ để xem từ' });
    fireEvent.pointerDown(hold);
    expect(hold).toHaveTextContent('Kẻ giả mạo');
    expect(hold).toHaveTextContent('Không có từ');
    expect(hold).not.toHaveTextContent('Gà');
    fireEvent.pointerUp(hold);
    expect(hold).toHaveTextContent('Nhấn giữ để xem từ');
    expect(hold).not.toHaveTextContent('Kẻ giả mạo');

    fireEvent.click(screen.getByRole('button', { name: 'Tôi đã xem xong' }));
    expect(screen.getByText('Bình')).toBeInTheDocument();
    expect(screen.queryByText('An')).not.toBeInTheDocument();
    const next = screen.getByRole('button', { name: 'Nhấn giữ để xem từ' });
    fireEvent.pointerDown(next);
    expect(screen.getByText('Gà')).toBeInTheDocument();
    fireEvent.pointerUp(next);
    expect(screen.queryByText('Gà')).not.toBeInTheDocument();
  });
});
