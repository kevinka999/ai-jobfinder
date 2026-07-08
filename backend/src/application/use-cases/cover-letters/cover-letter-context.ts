import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Job } from '../../../domain/jobs/job';
import type { UserProfile } from '../../../domain/users/user-profile';
import type { CoverLetterJobInput } from '../../ports/ai-provider.port';
import type { JobRepository } from '../../ports/job-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';

export type ActiveCoverLetterContext = {
  user: UserProfile;
  job: Job;
};

export async function loadActiveCoverLetterContext(input: {
  userRepository: UserRepository;
  jobRepository: JobRepository;
  jobId: string;
}): Promise<ActiveCoverLetterContext> {
  const user = await input.userRepository.resolveDefaultUser();
  const job = await input.jobRepository.findById({
    userId: user.id,
    jobId: input.jobId,
  });

  if (!job) {
    throw new NotFoundException('Job was not found.');
  }

  if (job.status !== 'active') {
    throw new BadRequestException(
      'Cover-letter actions are allowed only for active jobs.',
    );
  }

  return { user, job };
}

export function toCoverLetterJobInput(job: Job): CoverLetterJobInput {
  return {
    companyName: job.companyName,
    title: job.title,
    description: job.description,
    applicationUrl: job.applicationUrl,
    location: job.location,
    workModel: job.workModel,
    salaryText: job.salaryText,
    techStack: job.techStack,
    matchingScore: job.matchingScore,
    matchingReason: job.matchingReason,
  };
}

export function toCoverLetterRevisionJobInput(
  job: Job,
): Omit<CoverLetterJobInput, 'matchingScore' | 'matchingReason'> {
  return {
    companyName: job.companyName,
    title: job.title,
    description: job.description,
    applicationUrl: job.applicationUrl,
    location: job.location,
    workModel: job.workModel,
    salaryText: job.salaryText,
    techStack: job.techStack,
  };
}
