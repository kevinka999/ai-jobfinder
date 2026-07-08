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
