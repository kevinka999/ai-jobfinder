import { UserProfile } from '../../../domain/users/user-profile';

export class UserProfileResponseDto {
  id!: string;
  resumeMarkdown!: string;
  jobTitleKeywords!: string[];
  technicalSkillKeywords!: string[];
  createdAt!: string;
  updatedAt!: string;

  static fromDomain(profile: UserProfile): UserProfileResponseDto {
    return {
      id: profile.id,
      resumeMarkdown: profile.resumeMarkdown,
      jobTitleKeywords: profile.jobTitleKeywords,
      technicalSkillKeywords: profile.technicalSkillKeywords,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
