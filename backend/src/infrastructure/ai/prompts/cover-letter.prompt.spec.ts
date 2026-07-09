import { COVER_LETTER_DRAFT_PROMPT } from './cover-letter-draft.prompt';
import { COVER_LETTER_REVISION_PROMPT } from './cover-letter-revision.prompt';

describe('cover-letter prompts', () => {
  it('tells draft generation to downweight old or shallow experience', () => {
    const prompt = COVER_LETTER_DRAFT_PROMPT.buildInput({
      resumeMarkdown: [
        '# Resume',
        '- 10 years of React and TypeScript experience.',
        '- Used Cypress for one year in 2018.',
      ].join('\n'),
      job: {
        companyName: 'Example GmbH',
        title: 'Frontend Developer',
        description: 'Build React apps with Cypress tests.',
        applicationUrl: 'https://example.com/job',
        techStack: ['React', 'Cypress'],
      },
    });

    expect(prompt).toContain('recency, duration, repetition, and depth');
    expect(prompt).toContain(
      'For old, brief, or one-off experience, do not lead with it',
    );
    expect(prompt).toContain('mention it lightly as prior exposure');
  });

  it('tells revisions not to intensify old or shallow experience', () => {
    const prompt = COVER_LETTER_REVISION_PROMPT.buildInput({
      resumeMarkdown: [
        '# Resume',
        '- 10 years of React and TypeScript experience.',
        '- Used Cypress for one year in 2018.',
      ].join('\n'),
      job: {
        companyName: 'Example GmbH',
        title: 'Frontend Developer',
        description: 'Build React apps with Cypress tests.',
        applicationUrl: 'https://example.com/job',
        techStack: ['React', 'Cypress'],
      },
      currentDraftMarkdown: 'Dear Hiring Team,',
      revisionInstructions: 'Make it more tailored to the testing stack.',
    });

    expect(prompt).toContain(
      'Do not intensify old, brief, or one-off experience into a core strength',
    );
    expect(prompt).toContain('mention it lightly as prior exposure');
    expect(prompt).toContain('use cautious wording instead of strong claims');
  });
});
