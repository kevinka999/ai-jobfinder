import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class SaveResumeRequestDto {
  @IsString()
  resumeMarkdown!: string;
}

export class SaveCoverLetterInstructionTemplateRequestDto {
  @IsString()
  coverLetterInstructionTemplate!: string;
}

export class TechnicalSkillKeywordRequestDto {
  @IsString()
  keyword!: string;

  @IsInt()
  @Min(1)
  @Max(10)
  weight!: number;
}

export class SaveProfileKeywordsRequestDto {
  @IsArray()
  @IsString({ each: true })
  jobTitleKeywords!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TechnicalSkillKeywordRequestDto)
  technicalSkillKeywords!: TechnicalSkillKeywordRequestDto[];
}
