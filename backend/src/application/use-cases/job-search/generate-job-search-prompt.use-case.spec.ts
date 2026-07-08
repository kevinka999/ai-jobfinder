import type { UserRepository } from '../../ports/user-repository.port';
import type { UserProfile } from '../../../domain/users/user-profile';
import {
  buildJobSearchPrompt,
  GenerateJobSearchPromptUseCase,
} from './generate-job-search-prompt.use-case';

describe('GenerateJobSearchPromptUseCase', () => {
  const now = new Date('2026-07-08T12:00:00.000Z');
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: GenerateJobSearchPromptUseCase;

  beforeEach(() => {
    userRepository = {
      resolveDefaultUser: jest.fn(),
      saveResumeWithKeywords: jest.fn(),
    };

    useCase = new GenerateJobSearchPromptUseCase(userRepository);
  });

  it('loads stored keywords and returns a deterministic prompt', async () => {
    const profile: UserProfile = {
      id: 'default-user',
      resumeMarkdown: '# Resume',
      jobTitleKeywords: ['Frontend Developer', 'Full Stack Developer'],
      technicalSkillKeywords: ['React', 'TypeScript', 'NestJS'],
      createdAt: now,
      updatedAt: now,
    };

    userRepository.resolveDefaultUser.mockResolvedValue(profile);

    const result = await useCase.execute({
      sourcePlatformIds: ['linkedin', 'stepstone'],
      cities: ['Vienna', 'Salzburg'],
      workModels: ['hybrid', 'remote'],
    });

    expect(userRepository.resolveDefaultUser.mock.calls).toHaveLength(1);
    expect(result.prompt).toContain(
      'LinkedIn (linkedin), StepStone (stepstone)',
    );
    expect(result.prompt).toContain('Vienna, Salzburg');
    expect(result.prompt).toContain('hybrid, remote');
    expect(result.prompt).toContain('Frontend Developer, Full Stack Developer');
    expect(result.prompt).toContain('React, TypeScript, NestJS');
    expect(result.prompt).toContain('Return JSON only');
    expect(result.prompt).toContain('"jobs": []');
    expect(result.prompt).toContain('companyName');
    expect(result.prompt).toContain('matchingReason');
  });
});

describe('buildJobSearchPrompt', () => {
  it('does not call external services and marks empty stored keyword lists clearly', () => {
    const prompt = buildJobSearchPrompt({
      sourcePlatformIds: ['karriere'],
      cities: ['Graz'],
      workModels: ['onsite'],
      jobTitleKeywords: [],
      technicalSkillKeywords: [],
    });

    expect(prompt).toContain('karriere.at (karriere)');
    expect(prompt).toContain('Job-title keywords: (none stored)');
    expect(prompt).toContain('Technical-skill keywords: (none stored)');
    expect(prompt).toContain('sourcePlatformId must be one of: karriere');
    expect(prompt).toContain('workModel, when present, must be one of');
  });
});
