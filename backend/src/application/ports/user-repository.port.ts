import type {
  TechnicalSkillKeyword,
  UserProfile,
} from '../../domain/users/user-profile';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  resolveDefaultUser(): Promise<UserProfile>;
  saveResumeWithKeywords(input: {
    resumeMarkdown: string;
    jobTitleKeywords: string[];
    technicalSkillKeywords: string[];
  }): Promise<UserProfile>;
  saveCoverLetterInstructionTemplate(input: {
    coverLetterInstructionTemplate: string;
  }): Promise<UserProfile>;
  saveProfileKeywords(input: {
    jobTitleKeywords: string[];
    technicalSkillKeywords: TechnicalSkillKeyword[];
  }): Promise<UserProfile>;
}
