import { Inject, Injectable } from '@nestjs/common';
import type { Job } from '../../../domain/jobs/job';
import type { JobEditableFields } from '../../ports/job-repository.port';
import { JOB_REPOSITORY } from '../../ports/job-repository.port';
import type { JobRepository } from '../../ports/job-repository.port';
import { USER_REPOSITORY } from '../../ports/user-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';
import { ScheduleJobMatchingUseCase } from './schedule-job-matching.use-case';

@Injectable()
export class CreateJobUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(JOB_REPOSITORY)
    private readonly jobRepository: JobRepository,
    private readonly scheduleJobMatching: ScheduleJobMatchingUseCase,
  ) {}

  async execute(input: JobEditableFields): Promise<Job> {
    const user = await this.userRepository.resolveDefaultUser();

    const job = await this.jobRepository.create({
      ...input,
      userId: user.id,
      status: 'active',
    });
    await this.scheduleJobMatching.execute(job, user.matchingProfileVersion);
    return job;
  }
}
