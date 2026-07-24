import { DeterministicJobMatchingEvaluator } from './deterministic-job-matching.evaluator';

describe('DeterministicJobMatchingEvaluator', () => {
  it('weights strong matching skills above weak overlap', async () => {
    const evaluator = new DeterministicJobMatchingEvaluator();
    const profile = {
      jobTitleKeywords: ['Frontend Developer'],
      mainTechnicalSkillKeywords: [
        { keyword: 'React', weight: 10 },
        { keyword: 'Java', weight: 1 },
      ],
      secondaryTechnicalSkillKeywords: [],
    };
    const strong = await evaluator.evaluate({
      job: {
        id: '1',
        title: 'Frontend Developer',
        description: 'Build React user interfaces.',
        techStack: ['React'],
      },
      profile,
    });
    const weak = await evaluator.evaluate({
      job: {
        id: '2',
        title: 'Frontend Developer',
        description: 'Maintain Java services.',
        techStack: ['Java'],
      },
      profile,
    });
    expect(strong.matchingScore).toBeGreaterThan(weak.matchingScore);
    expect(strong.evidence.matchedSkills).toContain('React');
  });

  it('caps non-engineering roles despite incidental skill text', async () => {
    const result = await new DeterministicJobMatchingEvaluator().evaluate({
      job: {
        id: '1',
        title: 'Sales Manager',
        description: 'Sell React and Node.js consulting services.',
      },
      profile: {
        jobTitleKeywords: ['Software Engineer'],
        mainTechnicalSkillKeywords: [
          { keyword: 'React', weight: 10 },
          { keyword: 'Node.js', weight: 10 },
        ],
        secondaryTechnicalSkillKeywords: [],
      },
    });
    expect(result.matchingScore).toBeLessThanOrEqual(39);
  });
});
