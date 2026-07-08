import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { APPLICATION_STATUSES } from '../../../domain/applications/application-status';
import type { ApplicationStatus } from '../../../domain/applications/application-status';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class ListApplicationsQueryDto {
  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsIn(APPLICATION_STATUSES)
  status?: ApplicationStatus;
}

export class UpdateApplicationRequestDto {
  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsIn(APPLICATION_STATUSES)
  status?: ApplicationStatus;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  notes?: string;
}
