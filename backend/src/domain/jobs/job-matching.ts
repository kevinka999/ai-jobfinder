export const JOB_MATCHING_STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed',
  'stale',
] as const;

export type JobMatchingStatus = (typeof JOB_MATCHING_STATUSES)[number];

export type JobMatchingEvidence = {
  titleScore: number;
  technicalScore: number;
  responsibilityScore: number;
  requirementScore: number;
  matchedSkills: string[];
  missingOrWeakAreas: string[];
};

export type JobMatching = {
  status: JobMatchingStatus;
  profileVersion: number;
  inputVersion: number;
  requestedVersion: number;
  scoredAt?: Date | string;
  errorMessage?: string;
  evidence?: JobMatchingEvidence;
};

export const createPendingJobMatching = (profileVersion: number): JobMatching => ({
  status: 'pending',
  profileVersion,
  inputVersion: 1,
  requestedVersion: 1,
});
