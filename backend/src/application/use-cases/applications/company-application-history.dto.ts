import { ArrayMaxSize, ArrayUnique, IsArray, IsMongoId } from 'class-validator';
import type { ApplicationStatus } from '../../../domain/applications/application-status';
import type { CompanyApplicationHistoryOutput } from './list-company-application-history.use-case';

export class CompanyApplicationHistoryRequestDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsMongoId({ each: true })
  jobIds!: string[];
}

export class CompanyApplicationHistoryResponseDto {
  jobId!: string;
  companyName!: string;
  applications!: Array<{
    id: string;
    jobId: string;
    applicationUrl: string;
    companyName: string;
    techStack?: string[];
    title: string;
    status: ApplicationStatus;
    createdAt: string;
  }>;
  matchCount!: number;

  static fromUseCase(
    input: CompanyApplicationHistoryOutput,
  ): CompanyApplicationHistoryResponseDto {
    return {
      jobId: input.jobId,
      companyName: input.companyName,
      applications: input.applications.map((application) => ({
        id: application.id,
        jobId: application.jobId,
        applicationUrl: application.applicationUrl,
        companyName: application.companyName,
        techStack: application.techStack,
        title: application.title,
        status: application.status,
        createdAt: application.createdAt.toISOString(),
      })),
      matchCount: input.applications.length,
    };
  }
}
