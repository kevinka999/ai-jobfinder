import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER } from '../../ports/ai-provider.port';
import type { AiProvider } from '../../ports/ai-provider.port';
import { JOB_REPOSITORY } from '../../ports/job-repository.port';
import type { JobRepository } from '../../ports/job-repository.port';
import { USER_REPOSITORY } from '../../ports/user-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';
import {
  loadActiveCoverLetterContext,
  toCoverLetterJobInput,
} from './cover-letter-context';

@Injectable()
export class GenerateCoverLetterDraftUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(JOB_REPOSITORY)
    private readonly jobRepository: JobRepository,
    @Inject(AI_PROVIDER)
    private readonly aiProvider: AiProvider,
  ) {}

  async execute(input: {
    jobId: string;
    userInstructions?: string;
  }): Promise<{ draftMarkdown: string }> {
    const { user, job } = await loadActiveCoverLetterContext({
      userRepository: this.userRepository,
      jobRepository: this.jobRepository,
      jobId: input.jobId,
    });

    return this.aiProvider.generateCoverLetterDraft({
      resumeMarkdown: user.resumeMarkdown,
      job: toCoverLetterJobInput(job),
      userInstructions: input.userInstructions,
    });
  }
}
