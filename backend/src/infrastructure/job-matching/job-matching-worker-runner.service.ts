import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import { JOB_MATCHING_QUEUE, type JobMatchingQueueMessage } from './job-matching-queue.service';

@Injectable()
export class JobMatchingWorkerRunner implements OnModuleDestroy {
  private readonly logger = new Logger(JobMatchingWorkerRunner.name);
  private readonly worker: Worker<JobMatchingQueueMessage>;

  constructor(config: ConfigService) {
    this.worker = new Worker(JOB_MATCHING_QUEUE, async (job) => {
      this.logger.log({ event: 'started', queueJobId: job.id, persistedJobId: job.data.jobId, revisions: job.data });
      // The Phase 6 processor is intentionally installed here; this foundation
      // verifies independent worker startup without moving HTTP work into Redis.
    }, {
      connection: { url: config.getOrThrow<string>('REDIS_URL'), maxRetriesPerRequest: null },
      concurrency: config.getOrThrow<number>('JOB_MATCHING_CONCURRENCY'),
    });
  }

  async onModuleDestroy() {
    await this.worker.close();
  }
}
