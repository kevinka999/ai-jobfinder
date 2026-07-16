import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

export const JOB_MATCHING_QUEUE = 'job-matching';

export type JobMatchingQueueMessage = {
  jobId: string;
  userId: string;
  profileVersion: number;
  inputVersion: number;
  requestedVersion: number;
};

@Injectable()
export class JobMatchingQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(JobMatchingQueueService.name);
  private readonly queue: Queue<JobMatchingQueueMessage>;

  constructor(config: ConfigService) {
    this.queue = new Queue(JOB_MATCHING_QUEUE, {
      connection: { url: config.getOrThrow<string>('REDIS_URL'), maxRetriesPerRequest: null },
      defaultJobOptions: {
        attempts: config.getOrThrow<number>('JOB_MATCHING_ATTEMPTS'),
        backoff: { type: 'exponential', delay: config.getOrThrow<number>('JOB_MATCHING_RETRY_DELAY_MS') },
        removeOnComplete: { count: config.getOrThrow<number>('JOB_MATCHING_COMPLETED_RETENTION') },
        removeOnFail: { count: config.getOrThrow<number>('JOB_MATCHING_FAILED_RETENTION') },
      },
    });
  }

  async enqueue(message: JobMatchingQueueMessage): Promise<'queued' | 'alreadyQueued'> {
    // BullMQ reserves ':' for its Redis key namespace and rejects it in custom IDs.
    const jobId = `job-match-${message.jobId}-${message.profileVersion}-${message.inputVersion}-${message.requestedVersion}`;
    const existing = await this.queue.getJob(jobId);
    if (existing) return 'alreadyQueued';
    await this.queue.add('match-job', message, { jobId });
    this.logger.log({ event: 'queued', queueJobId: jobId, persistedJobId: message.jobId, revisions: message });
    return 'queued';
  }

  async onModuleDestroy() {
    await this.queue.close();
  }
}
