import { Body, Controller, Get, Post } from '@nestjs/common';
import { ResolveDefaultUserUseCase } from './resolve-default-user.use-case';
import {
  SaveCoverLetterInstructionTemplateRequestDto,
  SaveResumeRequestDto,
} from './save-resume.dto';
import { SaveCoverLetterInstructionTemplateUseCase } from './save-cover-letter-instruction-template.use-case';
import { SaveResumeUseCase } from './save-resume.use-case';
import { UserProfileResponseDto } from './user-profile-response.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly resolveDefaultUserUseCase: ResolveDefaultUserUseCase,
    private readonly saveResumeUseCase: SaveResumeUseCase,
    private readonly saveCoverLetterInstructionTemplateUseCase: SaveCoverLetterInstructionTemplateUseCase,
  ) {}

  @Get('profile')
  async getProfile(): Promise<UserProfileResponseDto> {
    const profile = await this.resolveDefaultUserUseCase.execute();

    return UserProfileResponseDto.fromDomain(profile);
  }

  @Post('profile/resume')
  async saveResume(
    @Body() request: SaveResumeRequestDto,
  ): Promise<UserProfileResponseDto> {
    const profile = await this.saveResumeUseCase.execute({
      resumeMarkdown: request.resumeMarkdown,
    });

    return UserProfileResponseDto.fromDomain(profile);
  }

  @Post('profile/cover-letter-instruction-template')
  async saveCoverLetterInstructionTemplate(
    @Body() request: SaveCoverLetterInstructionTemplateRequestDto,
  ): Promise<UserProfileResponseDto> {
    const profile =
      await this.saveCoverLetterInstructionTemplateUseCase.execute({
        coverLetterInstructionTemplate: request.coverLetterInstructionTemplate,
      });

    return UserProfileResponseDto.fromDomain(profile);
  }
}
