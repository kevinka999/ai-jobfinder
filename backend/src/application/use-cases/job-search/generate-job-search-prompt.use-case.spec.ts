import type { UserRepository } from '../../ports/user-repository.port';
import type { UserProfile } from '../../../domain/users/user-profile';
import {
  buildJobLinksPrompt,
  buildJobSearchPrompt,
  GenerateJobLinksPromptUseCase,
  GenerateJobSearchPromptUseCase,
} from './generate-job-search-prompt.use-case';

type PromptSchema = {
  type: string;
  additionalProperties: boolean;
  required: string[];
  properties: {
    jobs: {
      items: {
        additionalProperties: boolean;
        required: string[];
        properties: {
          sourcePlatformId: { enum: string[] };
          workModel: { enum: string[] };
          matchingScore: {
            type: string;
            minimum: number;
            maximum: number;
          };
        };
      };
    };
  };
};

describe('GenerateJobSearchPromptUseCase', () => {
  const now = new Date('2026-07-08T12:00:00.000Z');
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: GenerateJobSearchPromptUseCase;
  let linksUseCase: GenerateJobLinksPromptUseCase;

  beforeEach(() => {
    userRepository = {
      resolveDefaultUser: jest.fn(),
      saveCoverLetterInstructionTemplate: jest.fn(),
      saveResumeWithKeywords: jest.fn(),
    };

    useCase = new GenerateJobSearchPromptUseCase(userRepository);
    linksUseCase = new GenerateJobLinksPromptUseCase(userRepository);
  });

  it('loads stored keywords and returns a deterministic prompt', async () => {
    const profile: UserProfile = {
      id: 'default-user',
      resumeMarkdown: '# Resume',
      coverLetterInstructionTemplate: '',
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
    expect(result.prompt).toContain(
      'Translate every human-readable output field to English',
    );
    expect(result.prompt).toContain(
      'Keep company names, URLs, enum values, dates, and technical product names unchanged',
    );

    const schema = extractJsonSchema(result.prompt);
    expect(schema).toMatchObject({
      type: 'object',
      additionalProperties: false,
      required: ['jobs'],
    });
    expect(schema.properties.jobs.items).toMatchObject({
      additionalProperties: false,
      required: [
        'companyName',
        'title',
        'applicationUrl',
        'description',
        'sourcePlatformId',
      ],
    });
    expect(schema.properties.jobs.items.properties.sourcePlatformId).toEqual({
      enum: ['linkedin', 'stepstone', 'others'],
    });
    expect(schema.properties.jobs.items.properties.workModel).toEqual({
      enum: ['hybrid', 'remote'],
    });
    expect(schema.properties.jobs.items.properties.matchingScore).toEqual({
      type: 'number',
      minimum: 0,
      maximum: 100,
    });
  });

  it('loads stored keywords and returns a deterministic prompt for pasted job links', async () => {
    const profile: UserProfile = {
      id: 'default-user',
      resumeMarkdown: '# Resume',
      coverLetterInstructionTemplate: '',
      jobTitleKeywords: ['Frontend Developer'],
      technicalSkillKeywords: ['React', 'TypeScript'],
      createdAt: now,
      updatedAt: now,
    };

    userRepository.resolveDefaultUser.mockResolvedValue(profile);

    const result = await linksUseCase.execute({
      jobLinks: [
        'https://example.com/jobs/frontend-developer',
        'https://www.linkedin.com/jobs/view/123',
      ],
    });

    expect(userRepository.resolveDefaultUser.mock.calls).toHaveLength(1);
    expect(result.prompt).toContain(
      '- https://example.com/jobs/frontend-developer',
    );
    expect(result.prompt).toContain('- https://www.linkedin.com/jobs/view/123');
    expect(result.prompt).toContain('Do not search for additional jobs.');
    expect(result.prompt).toContain('Frontend Developer');
    expect(result.prompt).toContain('React, TypeScript');
    expect(result.prompt).toContain(
      'Translate every human-readable output field to English',
    );

    const schema = extractJsonSchema(result.prompt);
    expect(schema.properties.jobs.items.properties.sourcePlatformId).toEqual({
      enum: [
        'linkedin',
        'stepstone',
        'karriere',
        'willhaben',
        'others',
        'manual',
      ],
    });
    expect(schema.properties.jobs.items.properties.workModel).toEqual({
      enum: ['onsite', 'hybrid', 'remote'],
    });
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

    const schema = extractJsonSchema(prompt);
    expect(schema.properties.jobs.items.properties.sourcePlatformId).toEqual({
      enum: ['karriere', 'others'],
    });
    expect(schema.properties.jobs.items.properties.workModel).toEqual({
      enum: ['onsite'],
    });
  });

  it('builds link prompts with others source guidance for direct posting URLs', () => {
    const prompt = buildJobLinksPrompt({
      jobLinks: ['https://company.example/careers/42'],
      jobTitleKeywords: [],
      technicalSkillKeywords: [],
    });

    expect(prompt).toContain('- https://company.example/careers/42');
    expect(prompt).toContain('sourcePlatformId "others"');
    expect(prompt).toContain('Job-title keywords: (none stored)');

    const schema = extractJsonSchema(prompt);
    expect(schema.properties.jobs.items.properties.sourcePlatformId).toEqual({
      enum: [
        'linkedin',
        'stepstone',
        'karriere',
        'willhaben',
        'others',
        'manual',
      ],
    });
  });
});

function extractJsonSchema(prompt: string): PromptSchema {
  const [, schemaAndRest] = prompt.split(
    'The response must match this JSON Schema:\n',
  );
  const [schemaText] = schemaAndRest.split('\n\nField rules:');

  return JSON.parse(schemaText) as PromptSchema;
}
