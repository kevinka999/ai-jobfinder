import { Body, Controller, Get, Post } from '@nestjs/common';
import { ResolveDefaultUserUseCase } from './resolve-default-user.use-case';
import { SaveResumeRequestDto } from './save-resume.dto';
import { SaveResumeUseCase } from './save-resume.use-case';
import { UserProfileResponseDto } from './user-profile-response.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly resolveDefaultUserUseCase: ResolveDefaultUserUseCase,
    private readonly saveResumeUseCase: SaveResumeUseCase,
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
}
