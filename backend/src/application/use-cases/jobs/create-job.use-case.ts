import { Inject, Injectable } from '@nestjs/common';
import type { Job } from '../../../domain/jobs/job';
import type { JobEditableFields } from '../../ports/job-repository.port';
import { JOB_REPOSITORY } from '../../ports/job-repository.port';
import type { JobRepository } from '../../ports/job-repository.port';
import { USER_REPOSITORY } from '../../ports/user-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';

@Injectable()
export class CreateJobUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(JOB_REPOSITORY)
    private readonly jobRepository: JobRepository,
  ) {}

  async execute(input: JobEditableFields): Promise<Job> {
    const user = await this.userRepository.resolveDefaultUser();

    return this.jobRepository.create({
      ...input,
      userId: user.id,
      status: 'active',
    });
  }
}
