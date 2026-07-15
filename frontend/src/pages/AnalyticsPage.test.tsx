import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { ToastProvider } from '../components/ToastProvider';
import { AnalyticsPage } from './AnalyticsPage';

describe('AnalyticsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('summarizes application status and selected-day movements', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([
        applicationFixture({
          createdAt: '2026-07-15T08:00:00.000Z',
          id: 'application-1',
          status: 'applied',
          statusHistory: [
            { status: 'applied', changedAt: '2026-07-15T08:00:00.000Z' },
          ],
        }),
        applicationFixture({
          createdAt: '2026-07-15T09:00:00.000Z',
          id: 'application-2',
          status: 'rejected',
          statusHistory: [
            { status: 'applied', changedAt: '2026-07-15T09:00:00.000Z' },
            { status: 'rejected', changedAt: '2026-07-15T12:00:00.000Z' },
          ],
        }),
        applicationFixture({
          createdAt: '2026-07-14T09:00:00.000Z',
          id: 'application-3',
          status: 'interviewing',
          statusHistory: [
            { status: 'applied', changedAt: '2026-07-14T09:00:00.000Z' },
            { status: 'interviewing', changedAt: '2026-07-15T10:00:00.000Z' },
          ],
        }),
        applicationFixture({
          createdAt: '2026-07-15T10:00:00.000Z',
          id: 'application-4',
          status: 'offer',
          statusHistory: [
            { status: 'applied', changedAt: '2026-07-15T10:00:00.000Z' },
            { status: 'offer', changedAt: '2026-07-15T15:00:00.000Z' },
          ],
        }),
      ]),
      ok: true,
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ToastProvider>
        <AnalyticsPage />
      </ToastProvider>,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText('Analytics date'), {
      target: { value: '2026-07-15' },
    });

    expectCardValue('Jobs applied', '4');
    expectCardValue('Rejected', '1');
    expectCardValue('Waiting reply', '1');
    expectCardValue('In process', '2');
    expectCardValue('Applied on this day', '3');
    expectCardValue('Rejected on this day', '1');
    expectCardValue('Good news on this day', '2');
  });
});

function expectCardValue(label: string, value: string) {
  const card = screen.getByText(label).closest('article');

  expect(card).not.toBeNull();
  expect(within(card as HTMLElement).getByText(value)).toBeInTheDocument();
}

function applicationFixture(overrides: {
  createdAt: string;
  id: string;
  status: 'applied' | 'interviewing' | 'technical_test' | 'offer' | 'rejected';
  statusHistory: Array<{
    changedAt: string;
    status: 'applied' | 'interviewing' | 'technical_test' | 'offer' | 'rejected';
  }>;
}) {
  return {
    id: overrides.id,
    userId: 'default-user',
    jobId: `job-${overrides.id}`,
    status: overrides.status,
    notes: '',
    statusHistory: overrides.statusHistory,
    createdAt: overrides.createdAt,
    updatedAt: overrides.createdAt,
  };
}
