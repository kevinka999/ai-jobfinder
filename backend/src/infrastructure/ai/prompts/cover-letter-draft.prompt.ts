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
