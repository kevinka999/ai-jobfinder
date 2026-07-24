import type { UserRepository } from '../../ports/user-repository.port';
import type { UserProfile } from '../../../domain/users/user-profile';
import { SaveProfileKeywordsUseCase } from './save-profile-keywords.use-case';

describe('SaveProfileKeywordsUseCase', () => {
  const now = new Date('2026-07-12T12:00:00.000Z');
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: SaveProfileKeywordsUseCase;

  beforeEach(() => {
    userRepository = {
      resolveDefaultUser: jest.fn(),
      saveCoverLetterInstructionTemplate: jest.fn(),
      saveProfileKeywords: jest.fn(),
      saveResumeWithKeywords: jest.fn(),
    };

    useCase = new SaveProfileKeywordsUseCase(userRepository);
  });

  it('saves profile keywords separately from the resume', async () => {
    const updatedProfile: UserProfile = {
      id: 'default-user',
      resumeMarkdown: '# Resume',
      coverLetterInstructionTemplate: '',
      jobTitleKeywords: ['Backend Developer', 'Full Stack Developer'],
      mainTechnicalSkillKeywords: [{ keyword: 'Java', weight: 2 }],
      secondaryTechnicalSkillKeywords: [{ keyword: 'NestJS', weight: 10 }],
      matchingProfileVersion: 2,
      createdAt: now,
      updatedAt: now,
    };

    userRepository.saveProfileKeywords.mockResolvedValue(updatedProfile);

    await expect(
      useCase.execute({
        jobTitleKeywords: ['Backend Developer', 'Full Stack Developer'],
        mainTechnicalSkillKeywords: [{ keyword: 'Java', weight: 2 }],
        secondaryTechnicalSkillKeywords: [{ keyword: 'NestJS', weight: 10 }],
      }),
    ).resolves.toEqual(updatedProfile);

    expect(userRepository.saveProfileKeywords).toHaveBeenCalledWith({
      jobTitleKeywords: ['Backend Developer', 'Full Stack Developer'],
      mainTechnicalSkillKeywords: [{ keyword: 'Java', weight: 2 }],
      secondaryTechnicalSkillKeywords: [{ keyword: 'NestJS', weight: 10 }],
    });
    expect(userRepository.saveResumeWithKeywords).not.toHaveBeenCalled();
  });
});
