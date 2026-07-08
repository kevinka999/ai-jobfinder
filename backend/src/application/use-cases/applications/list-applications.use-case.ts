import { Inject, Injectable } from '@nestjs/common';
import type { Application } from '../../../domain/applications/application';
import type { ApplicationStatus } from '../../../domain/applications/application-status';
import type { Job } from '../../../domain/jobs/job';
import { APPLICATION_REPOSITORY } from '../../ports/application-repository.port';
import type { ApplicationRepository } from '../../ports/application-repository.port';
import { JOB_REPOSITORY } from '../../ports/job-repository.port';
import type { JobRepository } from '../../ports/job-repository.port';
import { USER_REPOSITORY } from '../../ports/user-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';

export type ApplicationWithJob = {
  application: Application;
  job?: Job;
};

@Injectable()
export class ListApplicationsUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    @Inject(JOB_REPOSITORY)
    private readonly jobRepository: JobRepository,
  ) {}

  async execute(input: {
    status?: ApplicationStatus;
  }): Promise<ApplicationWithJob[]> {
    const user = await this.userRepository.resolveDefaultUser();
    const applications = await this.applicationRepository.list({
      userId: user.id,
      status: input.status,
    });

    return Promise.all(
      applications.map(async (application) => ({
        application,
        job:
          (await this.jobRepository.findById({
            userId: user.id,
            jobId: application.jobId,
          })) ?? undefined,
      })),
    );
  }
}
