import {
  parseDraftMarkdownOutput,
  parseResumeKeywordsOutput,
} from './open-ai.provider';

describe('OpenAI provider response parsing', () => {
  it('parses and normalizes resume keyword arrays', () => {
    expect(
      parseResumeKeywordsOutput(
        JSON.stringify({
          jobTitleKeywords: [
            'Frontend Developer',
            'Frontend Developer ',
            '',
            'Node.js Developer',
          ],
          mainTechnicalSkillKeywords: [' React ', 'TypeScript', 'React'],
          secondaryTechnicalSkillKeywords: [' Kafka ', 'Kafka', 'React'],
        }),
      ),
    ).toEqual({
      jobTitleKeywords: ['Frontend Developer', 'Node.js Developer'],
      mainTechnicalSkillKeywords: ['React', 'TypeScript'],
      secondaryTechnicalSkillKeywords: ['Kafka'],
    });
  });

  it('rejects keyword responses without arrays', () => {
    expect(() =>
      parseResumeKeywordsOutput(
        JSON.stringify({
          jobTitleKeywords: 'Frontend Developer',
          mainTechnicalSkillKeywords: [],
          secondaryTechnicalSkillKeywords: [],
        }),
      ),
    ).toThrow('OpenAI keyword response must include string arrays.');
  });

  it('parses a cover-letter draft markdown response', () => {
    expect(
      parseDraftMarkdownOutput(
        JSON.stringify({
          draftMarkdown: '\nDear Hiring Team,\n\nI am interested.\n',
        }),
      ),
    ).toEqual({
      draftMarkdown: 'Dear Hiring Team,\n\nI am interested.',
    });
  });

  it('rejects an empty cover-letter draft', () => {
    expect(() =>
      parseDraftMarkdownOutput(JSON.stringify({ draftMarkdown: '   ' })),
    ).toThrow('OpenAI cover-letter response returned an empty draft.');
  });
});
