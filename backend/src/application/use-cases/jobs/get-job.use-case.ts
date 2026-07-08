import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Job } from '../../../domain/jobs/job';
import { JOB_REPOSITORY } from '../../ports/job-repository.port';
import type { JobRepository } from '../../ports/job-repository.port';
import { USER_REPOSITORY } from '../../ports/user-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';

@Injectable()
export class GetJobUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(JOB_REPOSITORY)
    private readonly jobRepository: JobRepository,
  ) {}

  async execute(input: { jobId: string }): Promise<Job> {
    const user = await this.userRepository.resolveDefaultUser();
    const job = await this.jobRepository.findById({
      userId: user.id,
      jobId: input.jobId,
    });

    if (!job) {
      throw new NotFoundException('Job was not found.');
    }

    return job;
  }
}
