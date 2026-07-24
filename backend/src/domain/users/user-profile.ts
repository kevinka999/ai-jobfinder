export const DEFAULT_TECHNICAL_SKILL_WEIGHT = 5;

export type TechnicalSkillKeyword = {
  keyword: string;
  weight: number;
};

export type UserProfile = {
  id: string;
  resumeMarkdown: string;
  coverLetterInstructionTemplate: string;
  jobTitleKeywords: string[];
  mainTechnicalSkillKeywords: TechnicalSkillKeyword[];
  secondaryTechnicalSkillKeywords: TechnicalSkillKeyword[];
  matchingProfileVersion: number;
  createdAt: Date;
  updatedAt: Date;
};
