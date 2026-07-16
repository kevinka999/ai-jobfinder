import type { SourcePlatformId } from '../source-platforms/source-platform';
import type { JobStatus } from './job-status';
import type { WorkModel } from './work-model';
import type { JobMatching } from './job-matching';

export type JobMetadata = {
  possibleDuplicatedJobId?: string;
};

export type Job = {
  id: string;
  userId: string;
  companyName: string;
  title: string;
  applicationUrl: string;
  description: string;
  sourcePlatformId: SourcePlatformId;
  status: JobStatus;
  isFavorite: boolean;
  location?: string;
  workModel?: WorkModel;
  salaryText?: string;
  techStack?: string[];
  matchingScore?: number;
  matchingReason?: string;
  matching: JobMatching;
  postedAt?: Date | string;
  applyDeadline?: Date | string;
  contactInfo?: string;
  rawText?: string;
  metadata?: JobMetadata;
  deletedAt?: Date | string;
  createdAt: Date;
  updatedAt: Date;
};
