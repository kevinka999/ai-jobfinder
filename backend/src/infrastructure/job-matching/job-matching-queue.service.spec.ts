import { JobMatchingQueueService } from './job-matching-queue.service';

describe('JobMatchingQueueService', () => {
  it('uses a BullMQ-safe deterministic job ID', async () => {
    const service = Object.create(JobMatchingQueueService.prototype) as JobMatchingQueueService & { queue: { getJob: jest.Mock; add: jest.Mock }; logger: { log: jest.Mock } };
    service.queue = { getJob: jest.fn().mockResolvedValue(undefined), add: jest.fn().mockResolvedValue(undefined) };
    service.logger = { log: jest.fn() };
    await service.enqueue({ jobId: 'abc', userId: 'default-user', profileVersion: 1, inputVersion: 1, requestedVersion: 2 });
    expect(service.queue.add).toHaveBeenCalledWith('match-job', expect.anything(), { jobId: 'job-match-abc-1-1-2' });
  });
});
