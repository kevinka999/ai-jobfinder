import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import { JOB_MATCHING_QUEUE, type JobMatchingQueueMessage } from './job-matching-queue.service';
import { Inject } from '@nestjs/common';
import { JOB_REPOSITORY, type JobRepository } from '../../application/ports/job-repository.port';
import { USER_REPOSITORY, type UserRepository } from '../../application/ports/user-repository.port';
import { JOB_MATCHING_EVALUATOR, type JobMatchingEvaluator } from '../../application/ports/job-matching-evaluator.port';

@Injectable()
export class JobMatchingWorkerRunner implements OnModuleDestroy {
  private readonly logger = new Logger(JobMatchingWorkerRunner.name);
  private readonly worker: Worker<JobMatchingQueueMessage>;

  constructor(config: ConfigService, @Inject(JOB_REPOSITORY) private readonly jobs: JobRepository, @Inject(USER_REPOSITORY) private readonly users: UserRepository, @Inject(JOB_MATCHING_EVALUATOR) private readonly evaluator: JobMatchingEvaluator) {
    this.worker = new Worker(JOB_MATCHING_QUEUE, async (job) => {
      this.logger.log({ event: 'started', queueJobId: job.id, persistedJobId: job.data.jobId, revisions: job.data });
      const current = await this.jobs.findById({ userId: job.data.userId, jobId: job.data.jobId });
      if (!current || current.matching.profileVersion !== job.data.profileVersion || current.matching.inputVersion !== job.data.inputVersion || current.matching.requestedVersion !== job.data.requestedVersion) return;
      const profile = await this.users.resolveDefaultUser();
      if (profile.id !== job.data.userId || profile.matchingProfileVersion !== job.data.profileVersion) return;
      const revision = job.data;
      const processing = await this.jobs.markMatchingProcessing(revision);
      if (!processing) return;
      try {
        const result = await this.evaluator.evaluate({ job: current, profile });
        await this.jobs.completeMatching({ ...revision, ...result });
        this.logger.log({ event: 'completed', queueJobId: job.id, persistedJobId: job.data.jobId });
      } catch (error) {
        if ((job.attemptsMade + 1) >= (job.opts.attempts ?? 1)) {
          await this.jobs.failMatching({ ...revision, errorMessage: 'Matching evaluation failed. Recalculate to retry.' });
        }
        throw error;
      }
    }, {
      connection: { url: config.getOrThrow<string>('REDIS_URL'), maxRetriesPerRequest: null },
      concurrency: config.getOrThrow<number>('JOB_MATCHING_CONCURRENCY'),
    });
  }

  async onModuleDestroy() {
    await this.worker.close();
  }
}
