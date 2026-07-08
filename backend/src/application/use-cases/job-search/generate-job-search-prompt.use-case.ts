import { Inject, Injectable } from '@nestjs/common';
import { WORK_MODELS, WorkModel } from '../../../domain/jobs/work-model';
import {
  SOURCE_PLATFORMS,
  SourcePlatformId,
} from '../../../domain/source-platforms/source-platform';
import { USER_REPOSITORY } from '../../ports/user-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';

export type GenerateJobSearchPromptInput = {
  sourcePlatformIds: SourcePlatformId[];
  cities: string[];
  workModels: WorkModel[];
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

const OPTIONAL_JOB_FIELDS = [
  'location',
  'workModel',
  'salaryText',
  'techStack',
  'matchingScore',
  'matchingReason',
  'postedAt',
  'applyDeadline',
  'contactInfo',
  'rawText',
] as const;

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
    'The top-level object must use this wrapper shape:',
    '{',
    '  "jobs": []',
    '}',
    '',
    'Each item in jobs must include these required fields:',
    formatList(REQUIRED_JOB_FIELDS),
    '',
    'Each item in jobs may include these optional fields when available:',
    formatList(OPTIONAL_JOB_FIELDS),
    '',
    'Field rules:',
    `- sourcePlatformId must be one of: ${formatList(input.sourcePlatformIds)}`,
    `- workModel, when present, must be one of the selected values: ${formatList(input.workModels)}`,
    `- Supported workModel values are: ${formatList(WORK_MODELS)}`,
    '- techStack must be an array of strings when present.',
    '- postedAt and applyDeadline must be ISO date strings when available.',
    '- Do not invent missing details. Omit optional fields when the source does not provide them.',
  ].join('\n');
}

function formatList(values: readonly string[]): string {
  if (values.length === 0) {
    return '(none stored)';
  }

  return values.join(', ');
}
