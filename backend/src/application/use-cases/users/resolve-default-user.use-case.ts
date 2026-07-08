import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../ports/user-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';
import type { UserProfile } from '../../../domain/users/user-profile';

@Injectable()
export class ResolveDefaultUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  execute(): Promise<UserProfile> {
    return this.userRepository.resolveDefaultUser();
  }
}
