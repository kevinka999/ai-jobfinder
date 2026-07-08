export const JOB_STATUSES = ['draft', 'active', 'applied'] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];
