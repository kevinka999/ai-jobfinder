export type UserProfile = {
  id: string;
  resumeMarkdown: string;
  coverLetterInstructionTemplate: string;
  jobTitleKeywords: string[];
  technicalSkillKeywords: string[];
  createdAt: Date;
  updatedAt: Date;
};
