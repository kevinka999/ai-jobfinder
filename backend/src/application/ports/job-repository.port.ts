import type { Job, JobMetadata } from '../../domain/jobs/job';
import type { JobStatus } from '../../domain/jobs/job-status';
import type { WorkModel } from '../../domain/jobs/work-model';
import type { SourcePlatformId } from '../../domain/source-platforms/source-platform';
import type { JobMatchingEvidence } from '../../domain/jobs/job-matching';

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
  delete(input: { userId: string; jobId: string }): Promise<boolean>;
  softDeleteActive(input: {
    userId: string;
    jobId: string;
  }): Promise<Job | null>;
  findDuplicateCandidate(input: {
    userId: string;
    applicationUrl: string;
    companyName: string;
    title: string;
  }): Promise<Job | null>;
  findById(input: { userId: string; jobId: string }): Promise<Job | null>;
  findByIds(input: { userId: string; jobIds: string[] }): Promise<Job[]>;
  list(input: { userId: string; status?: JobStatus }): Promise<Job[]>;
  updateEditableFields(input: {
    userId: string;
    jobId: string;
    fields: Partial<JobEditableFields>;
  }): Promise<Job | null>;
  updateFavorite(input: {
    userId: string;
    jobId: string;
    isFavorite: boolean;
  }): Promise<Job | null>;
  updateStatus(input: {
    userId: string;
    jobId: string;
    status: JobStatus;
  }): Promise<Job | null>;
  listForMatching(input: { userId: string }): Promise<Job[]>;
  markMatchingPending(input: {
    userId: string;
    jobId: string;
    profileVersion: number;
    incrementRequestedVersion?: boolean;
  }): Promise<Job | null>;
  markMatchingProcessing(input: MatchingRevisionInput): Promise<Job | null>;
  completeMatching(input: MatchingRevisionInput & {
    matchingScore: number;
    matchingReason: string;
    evidence: JobMatchingEvidence;
  }): Promise<Job | null>;
  failMatching(input: MatchingRevisionInput & { errorMessage: string }): Promise<Job | null>;
}

export type MatchingRevisionInput = {
  userId: string;
  jobId: string;
  profileVersion: number;
  inputVersion: number;
  requestedVersion: number;
};
