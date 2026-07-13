import type { CoverLetterJobInput } from '../../../application/ports/ai-provider.port';

export const COVER_LETTER_REVISION_PROMPT = {
  instructions:
    'Revise a Markdown cover-letter draft according to the requested changes.',
  buildInput(input: {
    resumeMarkdown: string;
    job: Omit<CoverLetterJobInput, 'matchingScore' | 'matchingReason'>;
    currentDraftMarkdown: string;
    revisionInstructions: string;
  }): string {
    return [
      'Preserve truthful, resume-supported claims. Do not add unsupported skills, employers, or responsibilities.',
      'Keep the evidence weighting from the resume: recent, sustained, repeated, or deeply described experience may be emphasized.',
      'Do not intensify old, brief, or one-off experience into a core strength, even if the job mentions it.',
      'If an older or shallower skill remains relevant, mention it lightly as prior exposure or supporting context.',
      'When the resume does not make recency, duration, or depth clear, use cautious wording instead of strong claims.',
      'Revise toward a concise, practical, easy-to-scan letter that is specific to the company and role.',
      'Keep or restore a direct opening with job title, company, seniority or level, years of professional experience if resume-supported, main area of work, and two or three directly relevant technologies.',
      'Make the revised letter answer these questions: why this company or role, what qualifies the candidate for this position, and which practical experiences or characteristics they offer.',
      'Focus on only two or three core capabilities from the job requirements and support them with concrete resume evidence.',
      'Avoid turning the letter into a full-stack inventory or chronological resume repeat.',
      'Keep a clear connection between the position and the candidate next step: stack, product, architecture, domain, ownership, or responsibility.',
      'Remove excessive emotional language such as always dreamed of working here, amazing company, or similar generic praise.',
      'Remove unsupported adjective claims such as passionate, innovative, dynamic, or great team player unless immediately tied to concrete resume evidence.',
      'Use Dear Hiring Team as the greeting and Sincerely with the candidate name when the resume clearly provides it.',
      'Always write the draftMarkdown output in English. Translate job details from the posting to English when referring to the role, responsibilities, requirements, or benefits.',
      'Return the complete revised Markdown letter in the draftMarkdown field.',
      '',
      'Revision instructions:',
      input.revisionInstructions,
      '',
      'Current draft Markdown:',
      input.currentDraftMarkdown,
      '',
      'Resume Markdown:',
      input.resumeMarkdown,
      '',
      'Job:',
      JSON.stringify(input.job, null, 2),
    ].join('\n');
  },
};
