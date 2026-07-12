import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { ConfirmActionButton } from './ConfirmActionButton';

describe('ConfirmActionButton', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs the action only on the second click', () => {
    const onConfirm = vi.fn();

    renderConfirmButton(onConfirm);

    fireEvent.click(screen.getByRole('button', { name: /delete job/i }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: /confirm delete job/i }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /confirm delete job/i }),
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('button', { name: /delete job/i }),
    ).toBeInTheDocument();
  });

  it('leaves confirmation mode after the timeout passes', () => {
    vi.useFakeTimers();
    const onConfirm = vi.fn();

    renderConfirmButton(onConfirm);

    fireEvent.click(screen.getByRole('button', { name: /delete job/i }));

    expect(
      screen.getByRole('button', { name: /confirm delete job/i }),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(
      screen.getByRole('button', { name: /delete job/i }),
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

function renderConfirmButton(onConfirm: () => void) {
  render(
    <ConfirmActionButton
      ariaLabel="Delete job"
      confirmAriaLabel="Confirm delete job"
      confirmTitle="Click again to delete"
      icon={<span aria-hidden="true">x</span>}
      onConfirm={onConfirm}
      title="Delete job"
      variant="danger"
    />,
  );
}
