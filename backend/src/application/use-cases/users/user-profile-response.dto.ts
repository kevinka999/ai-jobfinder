import type {
  TechnicalSkillKeyword,
  UserProfile,
} from '../../../domain/users/user-profile';

export class UserProfileResponseDto {
  id!: string;
  resumeMarkdown!: string;
  coverLetterInstructionTemplate!: string;
  jobTitleKeywords!: string[];
  technicalSkillKeywords!: TechnicalSkillKeyword[];
  matchingProfileVersion!: number;
  createdAt!: string;
  updatedAt!: string;

  static fromDomain(profile: UserProfile): UserProfileResponseDto {
    return {
      id: profile.id,
      resumeMarkdown: profile.resumeMarkdown,
      coverLetterInstructionTemplate: profile.coverLetterInstructionTemplate,
      jobTitleKeywords: profile.jobTitleKeywords,
      technicalSkillKeywords: profile.technicalSkillKeywords,
      matchingProfileVersion: profile.matchingProfileVersion,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
