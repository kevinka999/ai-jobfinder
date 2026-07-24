import type { UserRepository } from '../../ports/user-repository.port';
import type { UserProfile } from '../../../domain/users/user-profile';
import { SaveCoverLetterInstructionTemplateUseCase } from './save-cover-letter-instruction-template.use-case';

describe('SaveCoverLetterInstructionTemplateUseCase', () => {
  const now = new Date('2026-07-09T12:00:00.000Z');
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: SaveCoverLetterInstructionTemplateUseCase;

  beforeEach(() => {
    userRepository = {
      resolveDefaultUser: jest.fn(),
      saveCoverLetterInstructionTemplate: jest.fn(),
      saveProfileKeywords: jest.fn(),
      saveResumeWithKeywords: jest.fn(),
    };

    useCase = new SaveCoverLetterInstructionTemplateUseCase(userRepository);
  });

  it('saves the cover-letter instruction template separately from the resume', async () => {
    const updatedProfile: UserProfile = {
      id: 'default-user',
      resumeMarkdown: '# Resume',
      coverLetterInstructionTemplate: 'Keep it concise.',
      jobTitleKeywords: ['Frontend Developer'],
      mainTechnicalSkillKeywords: [{ keyword: 'React', weight: 9 }],
      secondaryTechnicalSkillKeywords: [],
      createdAt: now,
      updatedAt: now,
    };

    userRepository.saveCoverLetterInstructionTemplate.mockResolvedValue(
      updatedProfile,
    );

    await expect(
      useCase.execute({
        coverLetterInstructionTemplate: 'Keep it concise.',
      }),
    ).resolves.toEqual(updatedProfile);

    expect(
      userRepository.saveCoverLetterInstructionTemplate,
    ).toHaveBeenCalledWith({
      coverLetterInstructionTemplate: 'Keep it concise.',
    });
    expect(userRepository.saveResumeWithKeywords).not.toHaveBeenCalled();
  });
});
