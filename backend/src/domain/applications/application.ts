import type { ApplicationStatus } from './application-status';

export type ApplicationStatusHistoryEntry = {
  status: ApplicationStatus;
  changedAt: Date;
};

export type Application = {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  notes?: string;
  statusHistory: ApplicationStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
};
