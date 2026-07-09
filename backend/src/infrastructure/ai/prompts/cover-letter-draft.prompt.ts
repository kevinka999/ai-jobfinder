import type { CoverLetterJobInput } from '../../../application/ports/ai-provider.port';

export const COVER_LETTER_DRAFT_PROMPT = {
  instructions:
    'Draft a concise, honest cover letter in Markdown for a job application.',
  buildInput(input: {
    resumeMarkdown: string;
    job: CoverLetterJobInput;
    userInstructions?: string;
  }): string {
    return [
      'Use only evidence from the resume and job details. Do not overclaim experience.',
      'Before drafting, weigh resume evidence by recency, duration, repetition, and depth of responsibility.',
      'Prioritize qualifications with recent, sustained, repeated, or deeply described experience.',
      'For old, brief, or one-off experience, do not lead with it, repeat it, or phrase it as a core strength.',
      'If an older or shallower skill is relevant to the job, mention it lightly as prior exposure or supporting context.',
      'When the resume does not make recency, duration, or depth clear, use cautious wording instead of strong claims.',
      'Keep the letter easy to scan, specific to the company and role, and suitable for converting to PDF.',
      'Return Markdown only in the draftMarkdown field.',
      '',
      `User instructions: ${input.userInstructions?.trim() || 'None'}`,
      '',
      'Resume Markdown:',
      input.resumeMarkdown,
      '',
      'Job:',
      JSON.stringify(input.job, null, 2),
    ].join('\n');
  },
};
