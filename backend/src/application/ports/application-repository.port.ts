import type { Application } from '../../domain/applications/application';
import type { ApplicationStatus } from '../../domain/applications/application-status';

export const APPLICATION_REPOSITORY = Symbol('APPLICATION_REPOSITORY');

export type CreateApplicationInput = {
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  statusChangedAt: Date;
};

export interface ApplicationRepository {
  create(input: CreateApplicationInput): Promise<Application>;
  findById(input: {
    userId: string;
    applicationId: string;
  }): Promise<Application | null>;
  findByUserAndJobId(input: {
    userId: string;
    jobId: string;
  }): Promise<Application | null>;
  list(input: {
    userId: string;
    status?: ApplicationStatus;
  }): Promise<Application[]>;
  updateTracking(input: {
    userId: string;
    applicationId: string;
    status?: ApplicationStatus;
    notes?: string;
    statusChangedAt?: Date;
  }): Promise<Application | null>;
}
