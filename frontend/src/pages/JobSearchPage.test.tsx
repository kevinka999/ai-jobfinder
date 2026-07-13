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

  it('imports selected JSON files and allows removing one before import', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        createdActiveJobs: [],
        createdDraftJobs: [],
        invalidRows: [],
        summary: {
          createdActive: 1,
          createdDraft: 0,
          invalid: 0,
          received: 1,
        },
      }),
      ok: true,
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ToastProvider>
        <JobSearchPage />
      </ToastProvider>,
    );

    const firstFile = new File(
      [
        JSON.stringify({
          jobs: [
            {
              applicationUrl: 'https://example.com/jobs/first',
              companyName: 'First Company',
              description: 'First description',
              sourcePlatformId: 'others',
              title: 'First Role',
            },
          ],
        }),
      ],
      'first-jobs.json',
      { type: 'application/json' },
    );
    const secondFile = new File(
      [
        JSON.stringify({
          jobs: [
            {
              applicationUrl: 'https://example.com/jobs/second',
              companyName: 'Second Company',
              description: 'Second description',
              sourcePlatformId: 'others',
              title: 'Second Role',
            },
          ],
        }),
      ],
      'second-jobs.json',
      { type: 'application/json' },
    );

    await user.upload(screen.getByLabelText('JSON files'), [
      firstFile,
      secondFile,
    ]);

    expect(screen.getByText('first-jobs.json')).toBeInTheDocument();
    expect(screen.getByText('second-jobs.json')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /remove first-jobs\.json/i }),
    );
    await user.click(screen.getByRole('button', { name: /import/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [, requestInit] = fetchMock.mock.calls[0];

    expect(JSON.parse(requestInit.body as string)).toEqual({
      jobs: [
        {
          applicationUrl: 'https://example.com/jobs/second',
          companyName: 'Second Company',
          description: 'Second description',
          sourcePlatformId: 'others',
          title: 'Second Role',
        },
      ],
    });
  });

  it('imports selected JSON files one at a time and removes processed files', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        createdActiveJobs: [],
        createdDraftJobs: [],
        invalidRows: [],
        summary: {
          createdActive: 1,
          createdDraft: 0,
          invalid: 0,
          received: 1,
        },
      }),
      ok: true,
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ToastProvider>
        <JobSearchPage />
      </ToastProvider>,
    );

    const firstFile = new File(
      [
        JSON.stringify({
          jobs: [
            {
              applicationUrl: 'https://example.com/jobs/first',
              companyName: 'First Company',
              description: 'First description',
              sourcePlatformId: 'others',
              title: 'First Role',
            },
          ],
        }),
      ],
      'first-jobs.json',
      { type: 'application/json' },
    );
    const secondFile = new File(
      [
        JSON.stringify({
          jobs: [
            {
              applicationUrl: 'https://example.com/jobs/second',
              companyName: 'Second Company',
              description: 'Second description',
              sourcePlatformId: 'others',
              title: 'Second Role',
            },
          ],
        }),
      ],
      'second-jobs.json',
      { type: 'application/json' },
    );

    await user.upload(screen.getByLabelText('JSON files'), [
      firstFile,
      secondFile,
    ]);
    await user.click(screen.getByRole('button', { name: /import/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const [, firstRequestInit] = fetchMock.mock.calls[0];
    const [, secondRequestInit] = fetchMock.mock.calls[1];

    expect(JSON.parse(firstRequestInit.body as string)).toEqual({
      jobs: [
        {
          applicationUrl: 'https://example.com/jobs/first',
          companyName: 'First Company',
          description: 'First description',
          sourcePlatformId: 'others',
          title: 'First Role',
        },
      ],
    });
    expect(JSON.parse(secondRequestInit.body as string)).toEqual({
      jobs: [
        {
          applicationUrl: 'https://example.com/jobs/second',
          companyName: 'Second Company',
          description: 'Second description',
          sourcePlatformId: 'others',
          title: 'Second Role',
        },
      ],
    });
    await waitFor(() => {
      expect(screen.queryByText('first-jobs.json')).not.toBeInTheDocument();
      expect(screen.queryByText('second-jobs.json')).not.toBeInTheDocument();
    });
  });
});
