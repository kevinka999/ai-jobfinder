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
    expect(prompt).toContain(
      'Always write the draftMarkdown output in English',
    );
    expect(prompt).toContain(
      'Translate job details from the posting to English',
    );
  });

  it('tells draft generation to use a concise evidence-backed cover-letter structure', () => {
    const prompt = COVER_LETTER_DRAFT_PROMPT.buildInput({
      resumeMarkdown: [
        '# Resume',
        '- Senior Software Engineer with 8 years of experience.',
        '- Built TypeScript services and React applications.',
      ].join('\n'),
      job: {
        companyName: 'Example Product GmbH',
        title: 'Senior Full-Stack Engineer',
        description:
          'Own product architecture and build TypeScript services with React.',
        applicationUrl: 'https://example.com/job',
        techStack: ['TypeScript', 'React', 'Node.js'],
      },
      userInstructions: 'Keep it short.',
    });

    expect(prompt).toContain('Choose only two or three core capabilities');
    expect(prompt).toContain(
      'Prove each with resume-backed examples instead of listing the whole technology stack',
    );
    expect(prompt).toContain(
      'why this company or role, what qualifies the candidate for this position',
    );
    expect(prompt).toContain(
      'the stack, product, architecture, domain, ownership, or responsibility',
    );
    expect(prompt).toContain('Do not use excessive emotional language');
    expect(prompt).toContain('Do not use unsupported adjective claims');
    expect(prompt).toContain('Use Dear Hiring Team as the greeting');
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
    expect(prompt).toContain(
      'Always write the draftMarkdown output in English',
    );
    expect(prompt).toContain(
      'Translate job details from the posting to English',
    );
  });

  it('tells revisions to preserve the focused evidence-backed structure', () => {
    const prompt = COVER_LETTER_REVISION_PROMPT.buildInput({
      resumeMarkdown: [
        '# Resume',
        '- Senior Software Engineer with 8 years of experience.',
        '- Built TypeScript services and React applications.',
      ].join('\n'),
      job: {
        companyName: 'Example Product GmbH',
        title: 'Senior Full-Stack Engineer',
        description:
          'Own product architecture and build TypeScript services with React.',
        applicationUrl: 'https://example.com/job',
        techStack: ['TypeScript', 'React', 'Node.js'],
      },
      currentDraftMarkdown:
        'Dear Hiring Team,\n\nI have always dreamed of working for your amazing company.',
      revisionInstructions: 'Make it stronger.',
    });

    expect(prompt).toContain('Focus on only two or three core capabilities');
    expect(prompt).toContain('support them with concrete resume evidence');
    expect(prompt).toContain('full-stack inventory');
    expect(prompt).toContain('chronological resume repeat');
    expect(prompt).toContain('Remove excessive emotional language');
    expect(prompt).toContain('Remove unsupported adjective claims');
    expect(prompt).toContain('Use Dear Hiring Team as the greeting');
  });
});
