import { Controller, Get } from '@nestjs/common';
import { ResolveDefaultUserUseCase } from './resolve-default-user.use-case';
import { UserProfileResponseDto } from './user-profile-response.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly resolveDefaultUserUseCase: ResolveDefaultUserUseCase,
  ) {}

  @Get('profile')
  async getProfile(): Promise<UserProfileResponseDto> {
    const profile = await this.resolveDefaultUserUseCase.execute();

    return UserProfileResponseDto.fromDomain(profile);
  }
}
