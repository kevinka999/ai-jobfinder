import { UserProfile } from '../../domain/users/user-profile';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  resolveDefaultUser(): Promise<UserProfile>;
}
