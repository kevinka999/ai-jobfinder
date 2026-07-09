import { IsString } from 'class-validator';

export class SaveResumeRequestDto {
  @IsString()
  resumeMarkdown!: string;
}

export class SaveCoverLetterInstructionTemplateRequestDto {
  @IsString()
  coverLetterInstructionTemplate!: string;
}
