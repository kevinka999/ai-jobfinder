import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import {
  SOURCE_PLATFORM_IDS,
  SourcePlatformId,
} from '../../../domain/source-platforms/source-platform';
import { WORK_MODELS, WorkModel } from '../../../domain/jobs/work-model';

function trimStringArray(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  const items = value as unknown[];

  return items.map((item) => (typeof item === 'string' ? item.trim() : item));
}

export class JobSearchPromptRequestDto {
  @Transform(({ value }: TransformFnParams) => trimStringArray(value))
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(SOURCE_PLATFORM_IDS, { each: true })
  sourcePlatformIds!: SourcePlatformId[];

  @Transform(({ value }: TransformFnParams) => trimStringArray(value))
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  cities!: string[];

  @Transform(({ value }: TransformFnParams) => trimStringArray(value))
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(WORK_MODELS, { each: true })
  workModels!: WorkModel[];
}

export class JobSearchPromptResponseDto {
  prompt!: string;
}
