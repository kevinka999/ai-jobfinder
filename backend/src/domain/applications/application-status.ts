export const APPLICATION_STATUSES = [
  'applied',
  'interviewing',
  'technical_test',
  'offer',
  'rejected',
  'closed',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
