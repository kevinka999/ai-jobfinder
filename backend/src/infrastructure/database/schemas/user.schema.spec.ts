import { UserSchema } from './user.schema';

describe('UserSchema', () => {
  it('uses a string _id for the default internal user', () => {
    expect(UserSchema.path('_id').instance).toBe('String');
  });
});
