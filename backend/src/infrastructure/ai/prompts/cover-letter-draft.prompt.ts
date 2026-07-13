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
      'Keep the letter concise, practical, easy to scan, specific to the company and role, and suitable for converting to PDF.',
      'Use a natural company identifier instead of an unusually long legal company name when that would sound stiff or AI-generated.',
      'Start with a direct application sentence: job title, company, seniority or level, years of professional experience if the resume supports it, main area of work, and two or three technologies directly relevant to the role.',
      'In the body, answer these questions: why this company or role, what qualifies the candidate for this position, and which practical experiences or characteristics they offer.',
      'Choose only two or three core capabilities from the job requirements. Prove each with resume-backed examples instead of listing the whole technology stack.',
      'Connect the position to the candidate next step: the stack, product, architecture, domain, ownership, or responsibility should make sense from the resume and job details.',
      'Avoid repeating the resume chronologically. Summarize only the evidence that directly supports the selected capabilities.',
      'Do not use excessive emotional language such as always dreamed of working here, amazing company, or similar generic praise.',
      'Do not use unsupported adjective claims such as passionate, innovative, dynamic, or great team player unless immediately tied to concrete resume evidence.',
      'Use Dear Hiring Team as the greeting and Sincerely with the candidate name when the resume clearly provides it.',
      'Always write the draftMarkdown output in English. Translate job details from the posting to English when referring to the role, responsibilities, requirements, or benefits.',
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
