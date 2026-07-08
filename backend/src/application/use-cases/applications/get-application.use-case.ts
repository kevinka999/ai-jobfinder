import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Application } from '../../../domain/applications/application';
import type { Job } from '../../../domain/jobs/job';
import { APPLICATION_REPOSITORY } from '../../ports/application-repository.port';
import type { ApplicationRepository } from '../../ports/application-repository.port';
import { JOB_REPOSITORY } from '../../ports/job-repository.port';
import type { JobRepository } from '../../ports/job-repository.port';
import { USER_REPOSITORY } from '../../ports/user-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';

export type GetApplicationOutput = {
  application: Application;
  job?: Job;
};

@Injectable()
export class GetApplicationUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    @Inject(JOB_REPOSITORY)
    private readonly jobRepository: JobRepository,
  ) {}

  async execute(input: {
    applicationId: string;
  }): Promise<GetApplicationOutput> {
    const user = await this.userRepository.resolveDefaultUser();
    const application = await this.applicationRepository.findById({
      userId: user.id,
      applicationId: input.applicationId,
    });

    if (!application) {
      throw new NotFoundException('Application was not found.');
    }

    return {
      application,
      job:
        (await this.jobRepository.findById({
          userId: user.id,
          jobId: application.jobId,
        })) ?? undefined,
    };
  }
}
