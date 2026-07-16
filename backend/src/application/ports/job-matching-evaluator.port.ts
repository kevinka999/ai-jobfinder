import type { JobMatchingEvidence } from '../../domain/jobs/job-matching';
import type { TechnicalSkillKeyword } from '../../domain/users/user-profile';

export const JOB_MATCHING_EVALUATOR = Symbol('JOB_MATCHING_EVALUATOR');

export type JobMatchingEvaluationInput = {
  job: { id: string; title: string; description: string; techStack?: string[] };
  profile: { jobTitleKeywords: string[]; technicalSkillKeywords: TechnicalSkillKeyword[] };
};

export type JobMatchingEvaluationResult = {
  matchingScore: number;
  matchingReason: string;
  evidence: JobMatchingEvidence;
};

export interface JobMatchingEvaluator {
  evaluate(input: JobMatchingEvaluationInput): Promise<JobMatchingEvaluationResult>;
}
