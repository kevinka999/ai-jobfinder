import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class GenerateCoverLetterDraftRequestDto {
  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsString()
  @IsNotEmpty()
  jobId!: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsOptional()
  @IsString()
  userInstructions?: string;
}

export class ReviseCoverLetterDraftRequestDto {
  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsString()
  @IsNotEmpty()
  jobId!: string;

  @IsString()
  @IsNotEmpty()
  currentDraftMarkdown!: string;

  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsString()
  @IsNotEmpty()
  revisionInstructions!: string;
}

export class GenerateCoverLetterPdfRequestDto {
  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsString()
  @IsNotEmpty()
  jobId!: string;

  @IsString()
  @IsNotEmpty()
  finalDraftMarkdown!: string;
}

export class CoverLetterDraftResponseDto {
  draftMarkdown!: string;
}
