import { IsString } from 'class-validator';

export class SaveResumeRequestDto {
  @IsString()
  resumeMarkdown!: string;
}
