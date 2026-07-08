import { InternalServerErrorException } from '@nestjs/common';
import type { AiProvider } from '../../ports/ai-provider.port';
import type { UserRepository } from '../../ports/user-repository.port';
import type { UserProfile } from '../../../domain/users/user-profile';
import { SaveResumeUseCase } from './save-resume.use-case';

describe('SaveResumeUseCase', () => {
  const now = new Date('2026-07-08T12:00:00.000Z');
  let aiProvider: jest.Mocked<AiProvider>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: SaveResumeUseCase;

  beforeEach(() => {
    aiProvider = {
      extractResumeKeywords: jest.fn(),
      generateCoverLetterDraft: jest.fn(),
      reviseCoverLetterDraft: jest.fn(),
    };

    userRepository = {
      resolveDefaultUser: jest.fn(),
      saveResumeWithKeywords: jest.fn(),
    };

    useCase = new SaveResumeUseCase(aiProvider, userRepository);
  });

  it('extracts keywords before saving the resume and returns the updated profile', async () => {
    const updatedProfile: UserProfile = {
      id: 'default-user',
      resumeMarkdown: '# Resume',
      jobTitleKeywords: ['Frontend Developer'],
      technicalSkillKeywords: ['React', 'TypeScript'],
      createdAt: now,
      updatedAt: now,
    };

    aiProvider.extractResumeKeywords.mockResolvedValue({
      jobTitleKeywords: ['Frontend Developer'],
      technicalSkillKeywords: ['React', 'TypeScript'],
    });
    userRepository.saveResumeWithKeywords.mockResolvedValue(updatedProfile);

    await expect(
      useCase.execute({ resumeMarkdown: '# Resume' }),
    ).resolves.toEqual(updatedProfile);

    expect(aiProvider.extractResumeKeywords).toHaveBeenCalledWith({
      resumeMarkdown: '# Resume',
    });
    expect(userRepository.saveResumeWithKeywords).toHaveBeenCalledWith({
      resumeMarkdown: '# Resume',
      jobTitleKeywords: ['Frontend Developer'],
      technicalSkillKeywords: ['React', 'TypeScript'],
    });
  });

  it('does not persist resume changes when keyword extraction fails', async () => {
    aiProvider.extractResumeKeywords.mockRejectedValue(
      new Error('provider unavailable'),
    );

    await expect(
      useCase.execute({ resumeMarkdown: '# Resume' }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(userRepository.saveResumeWithKeywords).not.toHaveBeenCalled();
  });
});
