import type { Application } from '../../../domain/applications/application';
import type { ApplicationStatus } from '../../../domain/applications/application-status';
import type { Job } from '../../../domain/jobs/job';
import { JobResponseDto } from '../jobs/job-response.dto';

export class ApplicationResponseDto {
  id!: string;
  userId!: string;
  jobId!: string;
  job?: JobResponseDto;
  status!: ApplicationStatus;
  notes?: string;
  statusHistory!: Array<{
    status: ApplicationStatus;
    changedAt: string;
  }>;
  createdAt!: string;
  updatedAt!: string;

  static fromDomain(input: {
    application: Application;
    job?: Job;
  }): ApplicationResponseDto {
    return {
      id: input.application.id,
      userId: input.application.userId,
      jobId: input.application.jobId,
      job: input.job ? JobResponseDto.fromDomain(input.job) : undefined,
      status: input.application.status,
      notes: input.application.notes,
      statusHistory: input.application.statusHistory.map((entry) => ({
        status: entry.status,
        changedAt: entry.changedAt.toISOString(),
      })),
      createdAt: input.application.createdAt.toISOString(),
      updatedAt: input.application.updatedAt.toISOString(),
    };
  }
}
