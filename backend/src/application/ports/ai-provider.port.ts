import type { WorkModel } from '../../domain/jobs/work-model';

export const AI_PROVIDER = Symbol('AI_PROVIDER');

export type ResumeKeywordExtractionResult = {
  jobTitleKeywords: string[];
  mainTechnicalSkillKeywords: string[];
  secondaryTechnicalSkillKeywords: string[];
};

export type CoverLetterJobInput = {
  companyName: string;
  title: string;
  description: string;
  applicationUrl: string;
  location?: string;
  workModel?: WorkModel;
  salaryText?: string;
  techStack?: string[];
  matchingScore?: number;
  matchingReason?: string;
};

export type CoverLetterDraftResult = {
  draftMarkdown: string;
};

export interface AiProvider {
  extractResumeKeywords(input: {
    resumeMarkdown: string;
  }): Promise<ResumeKeywordExtractionResult>;

  generateCoverLetterDraft(input: {
    resumeMarkdown: string;
    job: CoverLetterJobInput;
    userInstructions?: string;
  }): Promise<CoverLetterDraftResult>;

  reviseCoverLetterDraft(input: {
    resumeMarkdown: string;
    job: Omit<CoverLetterJobInput, 'matchingScore' | 'matchingReason'>;
    currentDraftMarkdown: string;
    revisionInstructions: string;
  }): Promise<CoverLetterDraftResult>;
}
