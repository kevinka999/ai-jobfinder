import { Inject, Injectable } from '@nestjs/common';
import { JOB_REPOSITORY, type JobRepository } from '../../ports/job-repository.port';
import { JobMatchingQueueService } from '../../../infrastructure/job-matching/job-matching-queue.service';
import type { Job } from '../../../domain/jobs/job';

@Injectable()
export class ScheduleJobMatchingUseCase {
  constructor(@Inject(JOB_REPOSITORY) private readonly jobs: JobRepository, private readonly queue: JobMatchingQueueService) {}

  async execute(job: Job, profileVersion: number, incrementRequestedVersion = false): Promise<void> {
    const pending = await this.jobs.markMatchingPending({ userId: job.userId, jobId: job.id, profileVersion, incrementRequestedVersion });
    if (!pending) return;
    try {
      await this.queue.enqueue({ jobId: pending.id, userId: pending.userId, profileVersion: pending.matching.profileVersion, inputVersion: pending.matching.inputVersion, requestedVersion: pending.matching.requestedVersion });
    } catch {
      await this.jobs.failMatching({ userId: pending.userId, jobId: pending.id, profileVersion: pending.matching.profileVersion, inputVersion: pending.matching.inputVersion, requestedVersion: pending.matching.requestedVersion, errorMessage: 'Matching could not be scheduled. Recalculate to retry.' });
    }
  }
}
