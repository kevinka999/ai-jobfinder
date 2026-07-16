import type { Job, JobMetadata } from '../../../domain/jobs/job';
import type { JobStatus } from '../../../domain/jobs/job-status';
import type { WorkModel } from '../../../domain/jobs/work-model';
import type { SourcePlatformId } from '../../../domain/source-platforms/source-platform';
import type { JobMatching } from '../../../domain/jobs/job-matching';

export class JobResponseDto {
  id!: string;
  userId!: string;
  companyName!: string;
  title!: string;
  applicationUrl!: string;
  description!: string;
  sourcePlatformId!: SourcePlatformId;
  status!: JobStatus;
  isFavorite!: boolean;
  location?: string;
  workModel?: WorkModel;
  salaryText?: string;
  techStack?: string[];
  matchingScore?: number;
  matchingReason?: string;
  matching!: JobMatching;
  postedAt?: string;
  applyDeadline?: string;
  contactInfo?: string;
  rawText?: string;
  metadata?: JobMetadata;
  deletedAt?: string;
  createdAt!: string;
  updatedAt!: string;

  static fromDomain(job: Job): JobResponseDto {
    return {
      id: job.id,
      userId: job.userId,
      companyName: job.companyName,
      title: job.title,
      applicationUrl: job.applicationUrl,
      description: job.description,
      sourcePlatformId: job.sourcePlatformId,
      status: job.status,
      isFavorite: job.isFavorite,
      location: job.location,
      workModel: job.workModel,
      salaryText: job.salaryText,
      techStack: job.techStack,
      matchingScore: job.matchingScore,
      matchingReason: job.matchingReason,
      matching: job.matching,
      postedAt: formatOptionalDate(job.postedAt),
      applyDeadline: formatOptionalDate(job.applyDeadline),
      contactInfo: job.contactInfo,
      rawText: job.rawText,
      metadata: job.metadata,
      deletedAt: formatOptionalDate(job.deletedAt),
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}

function formatOptionalDate(
  value: Date | string | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}
