import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Job } from '../../../domain/jobs/job';
import { normalizeCompanyMatchKey } from '../../../domain/jobs/company-name-normalization';
import { APPLICATION_REPOSITORY } from '../../ports/application-repository.port';
import type { ApplicationRepository } from '../../ports/application-repository.port';
import type { JobEditableFields } from '../../ports/job-repository.port';
import { JOB_REPOSITORY } from '../../ports/job-repository.port';
import type { JobRepository } from '../../ports/job-repository.port';
import { USER_REPOSITORY } from '../../ports/user-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';

@Injectable()
export class UpdateJobUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(JOB_REPOSITORY)
    private readonly jobRepository: JobRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(input: {
    jobId: string;
    fields: Partial<JobEditableFields>;
  }): Promise<Job> {
    const user = await this.userRepository.resolveDefaultUser();
    const job = await this.jobRepository.updateEditableFields({
      userId: user.id,
      jobId: input.jobId,
      fields: input.fields,
    });

    if (!job) {
      throw new NotFoundException('Job was not found.');
    }

    if (input.fields.companyName !== undefined) {
      await this.applicationRepository.updateCompanyMatchKeyByJobId({
        userId: user.id,
        jobId: input.jobId,
        companyMatchKey: normalizeCompanyMatchKey(job.companyName),
      });
    }

    return job;
  }
}
