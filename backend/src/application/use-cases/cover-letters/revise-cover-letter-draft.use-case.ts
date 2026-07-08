import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER } from '../../ports/ai-provider.port';
import type { AiProvider } from '../../ports/ai-provider.port';
import { JOB_REPOSITORY } from '../../ports/job-repository.port';
import type { JobRepository } from '../../ports/job-repository.port';
import { USER_REPOSITORY } from '../../ports/user-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';
import {
  loadActiveCoverLetterContext,
  toCoverLetterRevisionJobInput,
} from './cover-letter-context';

@Injectable()
export class ReviseCoverLetterDraftUseCase {
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
    currentDraftMarkdown: string;
    revisionInstructions: string;
  }): Promise<{ draftMarkdown: string }> {
    const { user, job } = await loadActiveCoverLetterContext({
      userRepository: this.userRepository,
      jobRepository: this.jobRepository,
      jobId: input.jobId,
    });

    return this.aiProvider.reviseCoverLetterDraft({
      resumeMarkdown: user.resumeMarkdown,
      job: toCoverLetterRevisionJobInput(job),
      currentDraftMarkdown: input.currentDraftMarkdown,
      revisionInstructions: input.revisionInstructions,
    });
  }
}
