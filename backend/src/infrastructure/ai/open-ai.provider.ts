import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  AiProvider,
  CoverLetterDraftResult,
  CoverLetterJobInput,
  ResumeKeywordExtractionResult,
} from '../../application/ports/ai-provider.port';
import { COVER_LETTER_DRAFT_PROMPT } from './prompts/cover-letter-draft.prompt';
import { COVER_LETTER_REVISION_PROMPT } from './prompts/cover-letter-revision.prompt';
import { RESUME_KEYWORDS_PROMPT } from './prompts/resume-keywords.prompt';

const DEFAULT_MODEL = 'gpt-4.1-mini';

const resumeKeywordsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['jobTitleKeywords', 'technicalSkillKeywords'],
  properties: {
    jobTitleKeywords: {
      type: 'array',
      items: { type: 'string' },
    },
    technicalSkillKeywords: {
      type: 'array',
      items: { type: 'string' },
    },
  },
};

const coverLetterDraftSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['draftMarkdown'],
  properties: {
    draftMarkdown: {
      type: 'string',
    },
  },
};

@Injectable()
export class OpenAiProvider implements AiProvider {
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    this.client = apiKey ? new OpenAI({ apiKey }) : null;
    this.model =
      this.configService.get<string>('OPENAI_MODEL') ?? DEFAULT_MODEL;
  }

  async extractResumeKeywords(input: {
    resumeMarkdown: string;
  }): Promise<ResumeKeywordExtractionResult> {
    const responseText = await this.createStructuredResponse({
      instructions: RESUME_KEYWORDS_PROMPT.instructions,
      input: RESUME_KEYWORDS_PROMPT.buildInput(input),
      schemaName: 'resume_keywords',
      schema: resumeKeywordsSchema,
      maxOutputTokens: 1200,
    });

    return parseResumeKeywordsOutput(responseText);
  }

  async generateCoverLetterDraft(input: {
    resumeMarkdown: string;
    job: CoverLetterJobInput;
    userInstructions?: string;
  }): Promise<CoverLetterDraftResult> {
    const responseText = await this.createStructuredResponse({
      instructions: COVER_LETTER_DRAFT_PROMPT.instructions,
      input: COVER_LETTER_DRAFT_PROMPT.buildInput(input),
      schemaName: 'cover_letter_draft',
      schema: coverLetterDraftSchema,
      maxOutputTokens: 1800,
    });

    return parseDraftMarkdownOutput(responseText);
  }

  async reviseCoverLetterDraft(input: {
    resumeMarkdown: string;
    job: Omit<CoverLetterJobInput, 'matchingScore' | 'matchingReason'>;
    currentDraftMarkdown: string;
    revisionInstructions: string;
  }): Promise<CoverLetterDraftResult> {
    const responseText = await this.createStructuredResponse({
      instructions: COVER_LETTER_REVISION_PROMPT.instructions,
      input: COVER_LETTER_REVISION_PROMPT.buildInput(input),
      schemaName: 'cover_letter_revision',
      schema: coverLetterDraftSchema,
      maxOutputTokens: 1800,
    });

    return parseDraftMarkdownOutput(responseText);
  }

  private async createStructuredResponse(input: {
    instructions: string;
    input: string;
    schemaName: string;
    schema: Record<string, unknown>;
    maxOutputTokens: number;
  }): Promise<string> {
    if (!this.client) {
      throw new Error('OPENAI_API_KEY must be configured before using AI.');
    }

    const response = await this.client.responses.create({
      model: this.model,
      instructions: input.instructions,
      input: input.input,
      text: {
        format: {
          type: 'json_schema',
          name: input.schemaName,
          schema: input.schema,
          strict: true,
        },
      },
      max_output_tokens: input.maxOutputTokens,
      store: false,
      temperature: 0.2,
    });

    if (!response.output_text) {
      throw new Error('OpenAI returned an empty response.');
    }

    return response.output_text;
  }
}

export function parseResumeKeywordsOutput(
  responseText: string,
): ResumeKeywordExtractionResult {
  const value = parseJsonObject(responseText);
  const jobTitleKeywords = normalizeStringArray(value.jobTitleKeywords);
  const technicalSkillKeywords = normalizeStringArray(
    value.technicalSkillKeywords,
  );

  if (jobTitleKeywords.length === 0 && technicalSkillKeywords.length === 0) {
    throw new Error('OpenAI keyword extraction returned no keywords.');
  }

  return {
    jobTitleKeywords,
    technicalSkillKeywords,
  };
}

export function parseDraftMarkdownOutput(
  responseText: string,
): CoverLetterDraftResult {
  const value = parseJsonObject(responseText);

  if (typeof value.draftMarkdown !== 'string') {
    throw new Error('OpenAI cover-letter response must include draftMarkdown.');
  }

  const draftMarkdown = value.draftMarkdown.trim();

  if (!draftMarkdown) {
    throw new Error('OpenAI cover-letter response returned an empty draft.');
  }

  return { draftMarkdown };
}

function parseJsonObject(responseText: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(responseText);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('OpenAI response must be a JSON object.');
  }

  return parsed as Record<string, unknown>;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error('OpenAI keyword response must include string arrays.');
  }

  return Array.from(
    new Set(
      value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0),
    ),
  );
}
