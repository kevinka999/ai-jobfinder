import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, vi } from 'vitest';
import { ToastProvider } from '../components/ToastProvider';
import { JobSearchPage } from './JobSearchPage';

describe('JobSearchPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('includes on-site in the default search prompt work model schema request', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ prompt: 'generated prompt' }),
      ok: true,
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ToastProvider>
        <JobSearchPage />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [, requestInit] = fetchMock.mock.calls[0];

    expect(JSON.parse(requestInit.body as string)).toMatchObject({
      workModels: ['onsite', 'hybrid', 'remote'],
    });
  });
});
