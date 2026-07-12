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
  'Translate every human-readable output field to English, including title, description, location, salaryText, techStack entries, matchingReason, contactInfo, and rawText. Keep company names, URLs, enum values, dates, and technical product names unchanged.';

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
  technicalSkillKeywords: TechnicalSkillKeyword[];
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
    '',
    ...buildCandidateMatchingProfileSection({
      jobTitleKeywords: input.jobTitleKeywords,
      technicalSkillKeywords: input.technicalSkillKeywords,
    }),
    '',
    'Scrape and extract job details first. Matching score is secondary metadata; do not omit a job only because the score is low.',
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

export function buildJobLinksPrompt(input: {
  jobLinks: string[];
  jobTitleKeywords: string[];
  technicalSkillKeywords: TechnicalSkillKeyword[];
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
    ...buildCandidateMatchingProfileSection({
      jobTitleKeywords: input.jobTitleKeywords,
      technicalSkillKeywords: input.technicalSkillKeywords,
    }),
    '',
    'For each link, extract the job details from that exact posting. Do not search for additional jobs.',
    'Use sourcePlatformId "others" for direct employer career pages or any link that is not one of the known job platforms.',
    'Use sourcePlatformId "manual" only for jobs that were manually created inside the app, not for AI-extracted link results.',
    'Scrape and extract job details first. Matching score is secondary metadata; do not omit a job only because the score is low.',
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

function buildCandidateMatchingProfileSection(input: {
  jobTitleKeywords: string[];
  technicalSkillKeywords: TechnicalSkillKeyword[];
}): string[] {
  const strongSkills = filterSkillsByWeight(
    input.technicalSkillKeywords,
    8,
    10,
  );
  const moderateSkills = filterSkillsByWeight(
    input.technicalSkillKeywords,
    4,
    7,
  );
  const weakSkills = filterSkillsByWeight(input.technicalSkillKeywords, 1, 3);

  return [
    'Candidate matching profile:',
    '- Evaluate job fit against this stored profile. Score from 0 to 100 based on evidence strength in the posting, not isolated keyword presence.',
    `- Job-title keywords: ${formatList(input.jobTitleKeywords)}`,
    `- Strong technical skills (weight 8-10): ${formatTechnicalSkillKeywords(strongSkills)}`,
    `- Moderate technical skills (weight 4-7): ${formatTechnicalSkillKeywords(moderateSkills)}`,
    `- Weak or historical technical skills (weight 1-3): ${formatTechnicalSkillKeywords(weakSkills)}`,
    '',
    'Scoring guidance:',
    '- 80-100: strong fit; core responsibilities center on stored job-title keywords and strong technical skills.',
    '- 60-79: reasonable fit; role matches several stored strengths but has gaps or heavier secondary areas.',
    '- 40-59: partial or stretch fit; some useful overlap, but core responsibilities lean away from strong stored skills.',
    '- 0-39: weak fit; role is mostly outside the stored profile or centered on weak, historical, or absent skills.',
    '- Do not over-score based only on isolated keyword overlap. Penalize roles where the main responsibility is outside the stored profile, even if a few familiar technologies appear.',
    '- When possible, include matchingScore and matchingReason grounded in the job description, candidate keywords, and technical-skill weights.',
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
