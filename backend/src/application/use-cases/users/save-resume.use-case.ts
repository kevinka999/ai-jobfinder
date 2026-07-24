import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AI_PROVIDER } from '../../ports/ai-provider.port';
import type { AiProvider } from '../../ports/ai-provider.port';
import { USER_REPOSITORY } from '../../ports/user-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';
import type { UserProfile } from '../../../domain/users/user-profile';

@Injectable()
export class SaveResumeUseCase {
  constructor(
    @Inject(AI_PROVIDER)
    private readonly aiProvider: AiProvider,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: { resumeMarkdown: string }): Promise<UserProfile> {
    let keywords: Awaited<ReturnType<AiProvider['extractResumeKeywords']>>;

    try {
      keywords = await this.aiProvider.extractResumeKeywords({
        resumeMarkdown: input.resumeMarkdown,
      });
    } catch {
      throw new InternalServerErrorException(
        'Could not extract resume keywords. The profile was not changed.',
      );
    }

    return this.userRepository.saveResumeWithKeywords({
      resumeMarkdown: input.resumeMarkdown,
      jobTitleKeywords: keywords.jobTitleKeywords,
      mainTechnicalSkillKeywords: keywords.mainTechnicalSkillKeywords,
      secondaryTechnicalSkillKeywords: keywords.secondaryTechnicalSkillKeywords,
    });
  }
}
