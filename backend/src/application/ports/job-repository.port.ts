import type { Job, JobMetadata } from '../../domain/jobs/job';
import type { JobStatus } from '../../domain/jobs/job-status';
import type { WorkModel } from '../../domain/jobs/work-model';
import type { SourcePlatformId } from '../../domain/source-platforms/source-platform';

export const JOB_REPOSITORY = Symbol('JOB_REPOSITORY');

export type JobEditableFields = {
  companyName: string;
  title: string;
  applicationUrl: string;
  description: string;
  sourcePlatformId: SourcePlatformId;
  location?: string;
  workModel?: WorkModel;
  salaryText?: string;
  techStack?: string[];
  matchingScore?: number;
  matchingReason?: string;
  postedAt?: string;
  applyDeadline?: string;
  contactInfo?: string;
  rawText?: string;
};

export type CreateJobInput = JobEditableFields & {
  userId: string;
  status: JobStatus;
  metadata?: JobMetadata;
};

export interface JobRepository {
  create(input: CreateJobInput): Promise<Job>;
  findDuplicateCandidate(input: {
    userId: string;
    applicationUrl: string;
    companyName: string;
    title: string;
  }): Promise<Job | null>;
}
