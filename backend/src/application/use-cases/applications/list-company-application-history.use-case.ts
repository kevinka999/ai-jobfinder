import { Inject, Injectable } from '@nestjs/common';
import type { ApplicationStatus } from '../../../domain/applications/application-status';
import { normalizeCompanyMatchKey } from '../../../domain/jobs/company-name-normalization';
import { APPLICATION_REPOSITORY } from '../../ports/application-repository.port';
import type { ApplicationRepository } from '../../ports/application-repository.port';
import { JOB_REPOSITORY } from '../../ports/job-repository.port';
import type { JobRepository } from '../../ports/job-repository.port';
import { USER_REPOSITORY } from '../../ports/user-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';

export type CompanyApplicationHistoryOutput = {
  jobId: string;
  companyName: string;
  applications: Array<{
    id: string;
    jobId: string;
    applicationUrl: string;
    companyName: string;
    techStack?: string[];
    title: string;
    status: ApplicationStatus;
    createdAt: Date;
  }>;
};

@Injectable()
export class ListCompanyApplicationHistoryUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(JOB_REPOSITORY)
    private readonly jobRepository: JobRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(input: {
    jobIds: string[];
  }): Promise<CompanyApplicationHistoryOutput[]> {
    const user = await this.userRepository.resolveDefaultUser();
    await this.backfillMissingCompanyMatchKeys(user.id);

    const uniqueJobIds = Array.from(new Set(input.jobIds));
    const targetJobs = await this.jobRepository.findByIds({
      userId: user.id,
      jobIds: uniqueJobIds,
    });
    const targetJobKeys = new Map(
      targetJobs.map((job) => [
        job.id,
        normalizeCompanyMatchKey(job.companyName),
      ]),
    );
    const companyMatchKeys = Array.from(
      new Set(Array.from(targetJobKeys.values()).filter(Boolean)),
    );
    const matchingApplications =
      await this.applicationRepository.listByCompanyMatchKeys({
        userId: user.id,
        companyMatchKeys,
      });
    const matchingJobs = await this.jobRepository.findByIds({
      userId: user.id,
      jobIds: matchingApplications.map((application) => application.jobId),
    });
    const matchingJobsById = new Map(matchingJobs.map((job) => [job.id, job]));

    return targetJobs.map((job) => {
      const companyMatchKey = targetJobKeys.get(job.id);
      const applications = matchingApplications
        .filter(
          (application) =>
            application.companyMatchKey === companyMatchKey &&
            application.jobId !== job.id,
        )
        .flatMap((application) => {
          const applicationJob = matchingJobsById.get(application.jobId);

          if (!applicationJob) {
            return [];
          }

          return [
            {
              id: application.id,
              jobId: application.jobId,
              applicationUrl: applicationJob.applicationUrl,
              companyName: applicationJob.companyName,
              techStack: applicationJob.techStack,
              title: applicationJob.title,
              status: application.status,
              createdAt: application.createdAt,
            },
          ];
        });

      return {
        jobId: job.id,
        companyName: job.companyName,
        applications,
      };
    });
  }

  private async backfillMissingCompanyMatchKeys(userId: string): Promise<void> {
    const applications =
      await this.applicationRepository.listMissingCompanyMatchKey({ userId });

    if (applications.length === 0) {
      return;
    }

    const jobs = await this.jobRepository.findByIds({
      userId,
      jobIds: applications.map((application) => application.jobId),
    });
    const jobsById = new Map(jobs.map((job) => [job.id, job]));

    await Promise.all(
      applications.map(async (application) => {
        const job = jobsById.get(application.jobId);

        if (!job) {
          return;
        }

        await this.applicationRepository.updateCompanyMatchKeyByJobId({
          userId,
          jobId: application.jobId,
          companyMatchKey: normalizeCompanyMatchKey(job.companyName),
        });
      }),
    );
  }
}
