import { Inject, Injectable } from '@nestjs/common';
import { WORK_MODELS } from '../../../domain/jobs/work-model';
import type { WorkModel } from '../../../domain/jobs/work-model';
import {
  SOURCE_PLATFORM_IDS,
  SOURCE_PLATFORMS,
} from '../../../domain/source-platforms/source-platform';
import type { SourcePlatformId } from '../../../domain/source-platforms/source-platform';
import type { TechnicalSkillKeyword } from '../../../domain/users/user-profile';
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

const ENGLISH_OUTPUT_RULE =
  'Translate every human-readable output field to English, including title, description, location, salaryText, techStack entries, contactInfo, and rawText. Keep company names, URLs, enum values, dates, and technical product names unchanged.';

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
        mainTechnicalSkillKeywords: profile.mainTechnicalSkillKeywords,
        secondaryTechnicalSkillKeywords:
          profile.secondaryTechnicalSkillKeywords,
      }),
    };
  }
}

@Injectable()
export class GenerateJobLinksPromptUseCase {
  execute(
    input: GenerateJobLinksPromptInput,
  ): Promise<GenerateJobSearchPromptOutput> {
    return Promise.resolve({
      prompt: buildJobLinksPrompt(input),
    });
  }
}

export function buildJobSearchPrompt(input: {
  sourcePlatformIds: SourcePlatformId[];
  cities: string[];
  workModels: WorkModel[];
  jobTitleKeywords: string[];
  mainTechnicalSkillKeywords: TechnicalSkillKeyword[];
  secondaryTechnicalSkillKeywords: TechnicalSkillKeyword[];
}): string {
  const platforms = input.sourcePlatformIds.map(
    (id) => `${SOURCE_PLATFORMS[id].label} (${id})`,
  );
  const outputSchema = buildJobSearchOutputSchema({
    sourcePlatformIds: includeOthersSourcePlatform(input.sourcePlatformIds),
    workModels: input.workModels,
  });

  return [
    'Search for job opportunities for me and return only valid JSON.',
    '',
    'Search constraints:',
    `- Source platforms: ${formatList(platforms)}`,
    `- Cities: ${formatList(input.cities)}`,
    `- Work models: ${formatList(input.workModels)}`,
    '- Include only currently active/open job postings.',
    '',
    ...buildStrongFitSearchSection({
      jobTitleKeywords: input.jobTitleKeywords,
      mainTechnicalSkillKeywords: input.mainTechnicalSkillKeywords,
      secondaryTechnicalSkillKeywords: input.secondaryTechnicalSkillKeywords,
    }),
    '',
    ...buildJobLanguageSection(),
    '',
    'Return only active positions that match the target roles and required main technologies. Order stronger English-language signals first. Do not calculate or return a matching score or matching reason.',
    '',
    'Return JSON only. Do not include Markdown fences, prose, comments, or explanations.',
    'The response must match this JSON Schema:',
    JSON.stringify(outputSchema, null, 2),
    '',
    'Field rules:',
    '- Do not invent missing details. Omit optional fields when the source does not provide them.',
    '- Use the selected sourcePlatformId values for jobs from those selected platforms.',
    '- Use sourcePlatformId "others" when the job source is not one of the selected or known platform IDs.',
    '- Use the selected workModel values only when the posting clearly supports them.',
    `- ${ENGLISH_OUTPUT_RULE}`,
  ].join('\n');
}

export function buildJobLinksPrompt(input: { jobLinks: string[] }): string {
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
    'For each link, extract the job details from that exact posting. Do not search for additional jobs.',
    'Use sourcePlatformId "others" for direct employer career pages or any link that is not one of the known job platforms.',
    'Use sourcePlatformId "manual" only for jobs that were manually created inside the app, not for AI-extracted link results.',
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
    `- ${ENGLISH_OUTPUT_RULE}`,
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

function includeOthersSourcePlatform(
  sourcePlatformIds: readonly SourcePlatformId[],
): SourcePlatformId[] {
  return Array.from(new Set([...sourcePlatformIds, 'others' as const]));
}

function formatList(values: readonly string[]): string {
  if (values.length === 0) {
    return '(none stored)';
  }

  return values.join(', ');
}

function buildStrongFitSearchSection(input: {
  jobTitleKeywords: string[];
  mainTechnicalSkillKeywords: TechnicalSkillKeyword[];
  secondaryTechnicalSkillKeywords: TechnicalSkillKeyword[];
}): string[] {
  const strongMainSkills = filterSkillsByWeight(
    input.mainTechnicalSkillKeywords,
    8,
    10,
  );
  const strongSecondarySkills = filterSkillsByWeight(
    input.secondaryTechnicalSkillKeywords,
    8,
    10,
  );
  return [
    'Target profile:',
    '- Search only for roles whose central responsibilities align with these job-title keywords and whose core stack matches the required main technologies.',
    `- Job-title keywords: ${formatList(input.jobTitleKeywords)}`,
    `- Required main technologies (weight 8-10): ${formatTechnicalSkillKeywords(strongMainSkills)}`,
    `- Optional secondary technologies (weight 8-10): ${formatTechnicalSkillKeywords(strongSecondarySkills)}`,
    '- Main technologies are the decisive technical filter: include roles that match most of them in the central responsibilities or required stack.',
    '- Secondary technologies are only a minor bonus. Do not reject an otherwise strong role because they are absent, and never use them to compensate for a mismatch in the main technologies.',
    '- Exclude roles whose core stack or responsibilities point in a different technical direction, even if isolated keywords overlap.',
  ];
}

function buildJobLanguageSection(): string[] {
  return [
    'Language rules:',
    '- Exclude a job when the posting explicitly requires any level of German.',
    '- Prioritize jobs with clear English-language signals: the posting is written in English, English is stated as the working language, or the posting mentions an international team or company environment.',
    '- Do not exclude a job merely because it does not state a working language. Keep it eligible, but rank jobs with explicit English-language signals first.',
  ];
}

function filterSkillsByWeight(
  values: readonly TechnicalSkillKeyword[],
  minWeight: number,
  maxWeight: number,
): TechnicalSkillKeyword[] {
  return values.filter(
    (skill) => skill.weight >= minWeight && skill.weight <= maxWeight,
  );
}

function formatTechnicalSkillKeywords(
  values: readonly TechnicalSkillKeyword[],
): string {
  if (values.length === 0) {
    return '(none stored)';
  }

  return values
    .map((skill) => `${skill.keyword} (${skill.weight}/10)`)
    .join(', ');
}
