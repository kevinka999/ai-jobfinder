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
