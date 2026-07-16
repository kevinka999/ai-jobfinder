import { Inject, Injectable } from '@nestjs/common';
import { JOB_REPOSITORY, type JobRepository } from '../../ports/job-repository.port';
import { USER_REPOSITORY, type UserRepository } from '../../ports/user-repository.port';
import { JobMatchingQueueService } from '../../../infrastructure/job-matching/job-matching-queue.service';

@Injectable()
export class RecalculateJobMatchingUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository, @Inject(JOB_REPOSITORY) private readonly jobs: JobRepository, private readonly queue: JobMatchingQueueService) {}
  async execute() {
    const user = await this.users.resolveDefaultUser();
    const jobs = await this.jobs.listForMatching({ userId: user.id });
    const summary = { eligible: jobs.length, queued: 0, alreadyQueued: 0, failedToQueue: 0 };
    for (const job of jobs) {
      const pending = await this.jobs.markMatchingPending({ userId: user.id, jobId: job.id, profileVersion: user.matchingProfileVersion, incrementRequestedVersion: true });
      if (!pending) continue;
      try {
        const outcome = await this.queue.enqueue({ jobId: pending.id, userId: user.id, profileVersion: pending.matching.profileVersion, inputVersion: pending.matching.inputVersion, requestedVersion: pending.matching.requestedVersion });
        summary[outcome]++;
      } catch {
        summary.failedToQueue++;
        await this.jobs.failMatching({ userId: user.id, jobId: pending.id, profileVersion: pending.matching.profileVersion, inputVersion: pending.matching.inputVersion, requestedVersion: pending.matching.requestedVersion, errorMessage: 'Matching could not be scheduled. Recalculate to retry.' });
      }
    }
    return { summary };
  }
}
