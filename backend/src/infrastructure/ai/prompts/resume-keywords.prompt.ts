export const RESUME_KEYWORDS_PROMPT = {
  instructions:
    'Extract job-search keywords from a resume. Return concise, deduplicated keywords only.',
  buildInput(input: { resumeMarkdown: string }): string {
    return [
      'Read this Markdown resume and extract keywords for job searching.',
      'Return job-title keywords as role names, and technical-skill keywords as technologies, tools, frameworks, or platforms.',
      'Prefer concrete terms present in or strongly supported by the resume. Do not invent seniority, roles, or skills.',
      '',
      input.resumeMarkdown,
    ].join('\n');
  },
};
