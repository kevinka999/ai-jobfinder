import { Inject, Injectable } from '@nestjs/common';
import { WORK_MODELS } from '../../../domain/jobs/work-model';
import type { WorkModel } from '../../../domain/jobs/work-model';
import {
  SOURCE_PLATFORM_IDS,
  SOURCE_PLATFORMS,
} from '../../../domain/source-platforms/source-platform';
import type { SourcePlatformId } from '../../../domain/source-platforms/source-platform';
import { USER_REPOSITORY } from '../../ports/user-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';

export type GenerateJobSearchPromptInput = {
  sourcePlatformIds: SourcePlatformId[];
  cities: string[];
  workModels: WorkModel[];
};

export type GenerateJobLinksPromptInput = {
  jobLinks: string[];
};

export type GenerateJobSearchPromptOutput = {
  prompt: string;
};

const REQUIRED_JOB_FIELDS = [
  'companyName',
  'title',
  'applicationUrl',
  'description',
  'sourcePlatformId',
] as const;

type JsonSchemaObject = {
  type: 'object';
  additionalProperties: false;
  required: string[];
  properties: Record<string, unknown>;
};

@Injectable()
export class GenerateJobSearchPromptUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: GenerateJobSearchPromptInput,
  ): Promise<GenerateJobSearchPromptOutput> {
    const profile = await this.userRepository.resolveDefaultUser();

    return {
      prompt: buildJobSearchPrompt({
        ...input,
        jobTitleKeywords: profile.jobTitleKeywords,
        technicalSkillKeywords: profile.technicalSkillKeywords,
      }),
    };
  }
}

@Injectable()
export class GenerateJobLinksPromptUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: GenerateJobLinksPromptInput,
  ): Promise<GenerateJobSearchPromptOutput> {
    const profile = await this.userRepository.resolveDefaultUser();

    return {
      prompt: buildJobLinksPrompt({
        ...input,
        jobTitleKeywords: profile.jobTitleKeywords,
        technicalSkillKeywords: profile.technicalSkillKeywords,
      }),
    };
  }
}

export function buildJobSearchPrompt(input: {
  sourcePlatformIds: SourcePlatformId[];
  cities: string[];
  workModels: WorkModel[];
  jobTitleKeywords: string[];
  technicalSkillKeywords: string[];
}): string {
  const platforms = input.sourcePlatformIds.map(
    (id) => `${SOURCE_PLATFORMS[id].label} (${id})`,
  );
  const outputSchema = buildJobSearchOutputSchema({
    sourcePlatformIds: input.sourcePlatformIds,
    workModels: input.workModels,
  });

  return [
    'Search for job opportunities for me and return only valid JSON.',
    '',
    'Search constraints:',
    `- Source platforms: ${formatList(platforms)}`,
    `- Cities: ${formatList(input.cities)}`,
    `- Work models: ${formatList(input.workModels)}`,
    '',
    'Candidate profile signals:',
    `- Job-title keywords: ${formatList(input.jobTitleKeywords)}`,
    `- Technical-skill keywords: ${formatList(input.technicalSkillKeywords)}`,
    '',
    'Find jobs that match the candidate profile. Include direct application links and full job descriptions whenever possible.',
    'When possible, include a numeric matchingScore from 0 to 100 and a short matchingReason grounded in the job description and candidate keywords.',
    '',
    'Return JSON only. Do not include Markdown fences, prose, comments, or explanations.',
    'The response must match this JSON Schema:',
    JSON.stringify(outputSchema, null, 2),
    '',
    'Field rules:',
    '- Do not invent missing details. Omit optional fields when the source does not provide them.',
    '- Use the selected sourcePlatformId values only.',
    '- Use the selected workModel values only when the posting clearly supports them.',
  ].join('\n');
}

export function buildJobLinksPrompt(input: {
  jobLinks: string[];
  jobTitleKeywords: string[];
  technicalSkillKeywords: string[];
}): string {
  const outputSchema = buildJobSearchOutputSchema({
    sourcePlatformIds: [...SOURCE_PLATFORM_IDS],
    workModels: [...WORK_MODELS],
  });

  return [
    'Scrape the specific job posting links below and return only valid JSON.',
    '',
    'Job posting links:',
    ...input.jobLinks.map((link) => `- ${link}`),
    '',
    'Candidate profile signals:',
    `- Job-title keywords: ${formatList(input.jobTitleKeywords)}`,
    `- Technical-skill keywords: ${formatList(input.technicalSkillKeywords)}`,
    '',
    'For each link, extract the job details from that exact posting. Do not search for additional jobs.',
    'Use sourcePlatformId "manual" for direct employer career pages or any link that is not one of the known job platforms.',
    'When possible, include a numeric matchingScore from 0 to 100 and a short matchingReason grounded in the job description and candidate keywords.',
    '',
    'Return JSON only. Do not include Markdown fences, prose, comments, or explanations.',
    'The response must match this JSON Schema:',
    JSON.stringify(outputSchema, null, 2),
    '',
    'Field rules:',
    '- Do not invent missing details. Omit optional fields when the source does not provide them.',
    '- Preserve the original posting URL in applicationUrl.',
    `- Use sourcePlatformId values only from: ${formatList([...SOURCE_PLATFORM_IDS])}.`,
    `- Use workModel values only from: ${formatList([...WORK_MODELS])}.`,
  ].join('\n');
}

function buildJobSearchOutputSchema(input: {
  sourcePlatformIds: SourcePlatformId[];
  workModels: WorkModel[];
}): JsonSchemaObject {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['jobs'],
    properties: {
      jobs: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: [...REQUIRED_JOB_FIELDS],
          properties: {
            companyName: { type: 'string' },
            title: { type: 'string' },
            applicationUrl: { type: 'string', format: 'uri' },
            description: { type: 'string' },
            sourcePlatformId: { enum: input.sourcePlatformIds },
            location: { type: 'string' },
            workModel: { enum: input.workModels },
            salaryText: { type: 'string' },
            techStack: {
              type: 'array',
              items: { type: 'string' },
            },
            matchingScore: {
              type: 'number',
              minimum: 0,
              maximum: 100,
            },
            matchingReason: { type: 'string' },
            postedAt: { type: 'string', format: 'date' },
            applyDeadline: { type: 'string', format: 'date' },
            contactInfo: { type: 'string' },
            rawText: { type: 'string' },
          },
        },
      },
    },
  };
}

function formatList(values: readonly string[]): string {
  if (values.length === 0) {
    return '(none stored)';
  }

  return values.join(', ');
}
