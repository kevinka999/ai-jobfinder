import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Drawer } from './Drawer';

describe('Drawer', () => {
  it('closes when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Drawer onClose={onClose} open title="Job Details">
        <button type="button">Inside drawer</button>
      </Drawer>,
    );

    await user.click(screen.getByRole('presentation'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stays open when drawer content is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Drawer onClose={onClose} open title="Job Details">
        <button type="button">Inside drawer</button>
      </Drawer>,
    );

    await user.click(screen.getByRole('button', { name: /inside drawer/i }));

    expect(onClose).not.toHaveBeenCalled();
  });
});
