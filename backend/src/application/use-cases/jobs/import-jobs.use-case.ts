import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import {
  JOB_REPOSITORY,
  JobEditableFields,
} from '../../ports/job-repository.port';
import type { JobRepository } from '../../ports/job-repository.port';
import { USER_REPOSITORY } from '../../ports/user-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';
import { Job } from '../../../domain/jobs/job';
import { JobImportItemDto, InvalidJobImportRowDto } from './import-jobs.dto';
import { ScheduleJobMatchingUseCase } from './schedule-job-matching.use-case';

export type ImportJobsOutput = {
  createdActiveJobs: Job[];
  createdDraftJobs: Job[];
  invalidRows: InvalidJobImportRowDto[];
  summary: {
    received: number;
    createdActive: number;
    createdDraft: number;
    invalid: number;
  };
};

type ValidImportRow = {
  index: number;
  value: JobEditableFields;
};

@Injectable()
export class ImportJobsUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(JOB_REPOSITORY)
    private readonly jobRepository: JobRepository,
    private readonly scheduleJobMatching: ScheduleJobMatchingUseCase,
  ) {}

  async execute(requestBody: unknown): Promise<ImportJobsOutput> {
    const { validRows, invalidRows, received } =
      validateImportJobsRequest(requestBody);
    const user = await this.userRepository.resolveDefaultUser();
    const createdActiveJobs: Job[] = [];
    const createdDraftJobs: Job[] = [];

    for (const row of validRows) {
      const duplicate = await this.jobRepository.findDuplicateCandidate({
        userId: user.id,
        applicationUrl: row.value.applicationUrl,
        companyName: row.value.companyName,
        title: row.value.title,
      });

      const createdJob = await this.jobRepository.create({
        ...row.value,
        userId: user.id,
        status: duplicate ? 'draft' : 'active',
        metadata: duplicate
          ? { possibleDuplicatedJobId: duplicate.id }
          : undefined,
      });
      await this.scheduleJobMatching.execute(createdJob, user.matchingProfileVersion);

      if (createdJob.status === 'draft') {
        createdDraftJobs.push(createdJob);
      } else {
        createdActiveJobs.push(createdJob);
      }
    }

    return {
      createdActiveJobs,
      createdDraftJobs,
      invalidRows,
      summary: {
        received,
        createdActive: createdActiveJobs.length,
        createdDraft: createdDraftJobs.length,
        invalid: invalidRows.length,
      },
    };
  }
}

export function validateImportJobsRequest(requestBody: unknown): {
  validRows: ValidImportRow[];
  invalidRows: InvalidJobImportRowDto[];
  received: number;
} {
  if (!isPlainRecord(requestBody)) {
    throw new BadRequestException('Request body must be a JSON object.');
  }

  const extraTopLevelKeys = Object.keys(requestBody).filter(
    (key) => key !== 'jobs',
  );

  if (extraTopLevelKeys.length > 0) {
    throw new BadRequestException(
      `Unknown top-level field(s): ${extraTopLevelKeys.join(', ')}.`,
    );
  }

  if (!Array.isArray(requestBody.jobs)) {
    throw new BadRequestException('Request body must include a jobs array.');
  }

  const validRows: ValidImportRow[] = [];
  const invalidRows: InvalidJobImportRowDto[] = [];

  requestBody.jobs.forEach((row, index) => {
    if (!isPlainRecord(row)) {
      invalidRows.push({
        index,
        errors: ['row must be an object'],
        value: row,
      });
      return;
    }

    const dto = plainToInstance(JobImportItemDto, row);
    const errors = validateSync(dto, {
      forbidNonWhitelisted: true,
      validationError: { target: false },
      whitelist: true,
    });

    if (errors.length > 0) {
      invalidRows.push({
        index,
        errors: flattenValidationErrors(errors),
        value: row,
      });
      return;
    }

    validRows.push({
      index,
      value: toJobEditableFields(dto),
    });
  });

  return {
    validRows,
    invalidRows,
    received: requestBody.jobs.length,
  };
}

function toJobEditableFields(dto: JobImportItemDto): JobEditableFields {
  return {
    companyName: dto.companyName,
    title: dto.title,
    applicationUrl: dto.applicationUrl,
    description: dto.description,
    sourcePlatformId: dto.sourcePlatformId,
    location: dto.location,
    workModel: dto.workModel,
    salaryText: dto.salaryText,
    techStack: dto.techStack,
    matchingScore: dto.matchingScore,
    matchingReason: dto.matchingReason,
    postedAt: dto.postedAt,
    applyDeadline: dto.applyDeadline,
    contactInfo: dto.contactInfo,
    rawText: dto.rawText,
  };
}

function flattenValidationErrors(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => {
    const messages = Object.values(error.constraints ?? {}).map(
      (message) => `${error.property}: ${message}`,
    );

    if (!error.children || error.children.length === 0) {
      return messages;
    }

    return [...messages, ...flattenValidationErrors(error.children)];
  });
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
