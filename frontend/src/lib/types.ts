export type SourcePlatformId =
  'linkedin' | 'stepstone' | 'karriere' | 'willhaben' | 'others' | 'manual';

export type WorkModel = 'onsite' | 'hybrid' | 'remote';

export type JobStatus = 'draft' | 'active' | 'applied';
export type JobMatchingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'stale';

export type ApplicationStatus =
  | 'applied'
  | 'interviewing'
  | 'technical_test'
  | 'offer'
  | 'rejected'
  | 'closed';

export type UserProfileResponse = {
  id: string;
  resumeMarkdown: string;
  coverLetterInstructionTemplate: string;
  jobTitleKeywords: string[];
  technicalSkillKeywords: TechnicalSkillKeyword[];
  matchingProfileVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type TechnicalSkillKeyword = {
  keyword: string;
  weight: number;
};

export type JobResponse = {
  id: string;
  userId: string;
  companyName: string;
  title: string;
  applicationUrl: string;
  description: string;
  sourcePlatformId: SourcePlatformId;
  status: JobStatus;
  isFavorite: boolean;
  location?: string;
  workModel?: WorkModel;
  salaryText?: string;
  techStack?: string[];
  matchingScore?: number;
  matchingReason?: string;
  matching: {
    status: JobMatchingStatus;
    profileVersion: number;
    inputVersion: number;
    requestedVersion: number;
    errorMessage?: string;
    evidence?: { titleScore: number; technicalScore: number; responsibilityScore: number; requirementScore: number; matchedSkills: string[]; missingOrWeakAreas: string[] };
  };
  postedAt?: string;
  applyDeadline?: string;
  contactInfo?: string;
  rawText?: string;
  metadata?: {
    possibleDuplicatedJobId?: string;
  };
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationResponse = {
  id: string;
  userId: string;
  jobId: string;
  job?: JobResponse;
  status: ApplicationStatus;
  notes?: string;
  statusHistory: Array<{
    status: ApplicationStatus;
    changedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type CompanyApplicationHistoryResponse = {
  jobId: string;
  companyName: string;
  applications: Array<{
    id: string;
    jobId: string;
    applicationUrl: string;
    companyName: string;
    techStack?: string[];
    title: string;
    status: ApplicationStatus;
    createdAt: string;
  }>;
  matchCount: number;
};

export type JobEditableFields = {
  companyName: string;
  title: string;
  applicationUrl: string;
  description: string;
  sourcePlatformId: SourcePlatformId;
  location?: string;
  workModel?: WorkModel;
  salaryText?: string;
  techStack?: string[];
  matchingScore?: number;
  matchingReason?: string;
  postedAt?: string;
  applyDeadline?: string;
  contactInfo?: string;
  rawText?: string;
};

export type ImportJobsResponse = {
  createdActiveJobs: JobResponse[];
  createdDraftJobs: JobResponse[];
  invalidRows: Array<{
    index: number;
    errors: string[];
    value: unknown;
  }>;
  summary: {
    received: number;
    createdActive: number;
    createdDraft: number;
    invalid: number;
  };
};

export const SOURCE_PLATFORMS: Array<{
  id: SourcePlatformId;
  label: string;
}> = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'stepstone', label: 'StepStone' },
  { id: 'karriere', label: 'Karriere' },
  { id: 'willhaben', label: 'Willhaben Jobs' },
  { id: 'others', label: 'Others' },
  { id: 'manual', label: 'Manual link' },
];

export const SEARCH_SOURCE_PLATFORMS = SOURCE_PLATFORMS.filter(
  (platform) => platform.id !== 'manual' && platform.id !== 'others',
);

export const WORK_MODEL_OPTIONS: Array<{ id: WorkModel; label: string }> = [
  { id: 'onsite', label: 'On-site' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'remote', label: 'Remote' },
];

export const DEFAULT_SEARCH_WORK_MODELS: WorkModel[] = [
  'onsite',
  'hybrid',
  'remote',
];

export const APPLICATION_STATUS_OPTIONS: Array<{
  id: ApplicationStatus;
  label: string;
}> = [
  { id: 'applied', label: 'Applied' },
  { id: 'interviewing', label: 'Interviewing' },
  { id: 'technical_test', label: 'Technical test' },
  { id: 'offer', label: 'Offer' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'closed', label: 'Closed' },
];
