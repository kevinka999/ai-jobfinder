export const WORK_MODELS = ['onsite', 'hybrid', 'remote'] as const;

export type WorkModel = (typeof WORK_MODELS)[number];
