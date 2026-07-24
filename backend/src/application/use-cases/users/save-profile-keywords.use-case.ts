import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../ports/user-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';
import type {
  TechnicalSkillKeyword,
  UserProfile,
} from '../../../domain/users/user-profile';

@Injectable()
export class SaveProfileKeywordsUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  execute(input: {
    jobTitleKeywords: string[];
    mainTechnicalSkillKeywords: TechnicalSkillKeyword[];
    secondaryTechnicalSkillKeywords: TechnicalSkillKeyword[];
  }): Promise<UserProfile> {
    return this.userRepository.saveProfileKeywords({
      jobTitleKeywords: input.jobTitleKeywords,
      mainTechnicalSkillKeywords: input.mainTechnicalSkillKeywords,
      secondaryTechnicalSkillKeywords: input.secondaryTechnicalSkillKeywords,
    });
  }
}
