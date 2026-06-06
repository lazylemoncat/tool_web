import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import BatchBar from './BatchBar';

describe('BatchBar', () => {
  it('does not render when no task is selected', () => {
    const { container } = render(
      <BatchBar
        count={0}
        onCompleteAll={vi.fn()}
        onMove={vi.fn()}
        onDelete={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('calls each batch action callback', async () => {
    const onCompleteAll = vi.fn();
    const onMove = vi.fn();
    const onDelete = vi.fn();
    const onCancel = vi.fn();

    render(
      <BatchBar
        count={3}
        onCompleteAll={onCompleteAll}
        onMove={onMove}
        onDelete={onDelete}
        onCancel={onCancel}
      />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);

    await userEvent.click(buttons[0]);
    await userEvent.click(buttons[1]);
    await userEvent.click(buttons[2]);
    await userEvent.click(buttons[3]);

    expect(onCompleteAll).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
