import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Application } from '../../../domain/applications/application';
import type { Job } from '../../../domain/jobs/job';
import { normalizeCompanyMatchKey } from '../../../domain/jobs/company-name-normalization';
import { APPLICATION_REPOSITORY } from '../../ports/application-repository.port';
import type { ApplicationRepository } from '../../ports/application-repository.port';
import { JOB_REPOSITORY } from '../../ports/job-repository.port';
import type { JobRepository } from '../../ports/job-repository.port';
import { USER_REPOSITORY } from '../../ports/user-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';

export type ApplyJobOutput = {
  application: Application;
  job: Job;
};

@Injectable()
export class ApplyJobUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(JOB_REPOSITORY)
    private readonly jobRepository: JobRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(input: { jobId: string }): Promise<ApplyJobOutput> {
    const user = await this.userRepository.resolveDefaultUser();
    const job = await this.jobRepository.findById({
      userId: user.id,
      jobId: input.jobId,
    });

    if (!job) {
      throw new NotFoundException('Job was not found.');
    }

    if (job.status !== 'active') {
      throw new BadRequestException(
        'Only active jobs can be marked as applied.',
      );
    }

    const updatedJob = await this.jobRepository.updateStatus({
      userId: user.id,
      jobId: input.jobId,
      status: 'applied',
    });

    if (!updatedJob) {
      throw new NotFoundException('Job was not found.');
    }

    const existingApplication =
      await this.applicationRepository.findByUserAndJobId({
        userId: user.id,
        jobId: input.jobId,
      });

    if (existingApplication) {
      return { application: existingApplication, job: updatedJob };
    }

    const application = await this.applicationRepository.create({
      userId: user.id,
      jobId: input.jobId,
      companyMatchKey: normalizeCompanyMatchKey(updatedJob.companyName),
      status: 'applied',
      statusChangedAt: new Date(),
    });

    return { application, job: updatedJob };
  }
}
