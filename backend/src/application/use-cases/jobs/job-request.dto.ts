import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import type { JobEditableFields } from '../../ports/job-repository.port';
import { JOB_STATUSES } from '../../../domain/jobs/job-status';
import type { JobStatus } from '../../../domain/jobs/job-status';
import { WORK_MODELS } from '../../../domain/jobs/work-model';
import type { WorkModel } from '../../../domain/jobs/work-model';
import { SOURCE_PLATFORM_IDS } from '../../../domain/source-platforms/source-platform';
import type { SourcePlatformId } from '../../../domain/source-platforms/source-platform';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function trimStringArray(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((item) => trimString(item));
}

export class ListJobsQueryDto {
  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsIn(JOB_STATUSES)
  status?: JobStatus;
}

export class CreateJobRequestDto implements JobEditableFields {
  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true })
  applicationUrl!: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsString()
  @IsNotEmpty()
  description!: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsIn(SOURCE_PLATFORM_IDS)
  sourcePlatformId!: SourcePlatformId;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  location?: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsIn(WORK_MODELS)
  workModel?: WorkModel;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  salaryText?: string;

  @Transform(({ value }: TransformFnParams) => trimStringArray(value))
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  techStack?: string[];

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  matchingScore?: number;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  matchingReason?: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsISO8601({ strict: true })
  postedAt?: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsISO8601({ strict: true })
  applyDeadline?: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  contactInfo?: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  rawText?: string;
}

export class UpdateJobRequestDto implements Partial<JobEditableFields> {
  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  companyName?: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true })
  applicationUrl?: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsIn(SOURCE_PLATFORM_IDS)
  sourcePlatformId?: SourcePlatformId;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  location?: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsIn(WORK_MODELS)
  workModel?: WorkModel;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  salaryText?: string;

  @Transform(({ value }: TransformFnParams) => trimStringArray(value))
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  techStack?: string[];

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  matchingScore?: number;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  matchingReason?: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsISO8601({ strict: true })
  postedAt?: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsISO8601({ strict: true })
  applyDeadline?: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  contactInfo?: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  rawText?: string;
}
