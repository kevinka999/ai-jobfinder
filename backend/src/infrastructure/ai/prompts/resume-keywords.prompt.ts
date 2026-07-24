export const RESUME_KEYWORDS_PROMPT = {
  instructions:
    'Extract and classify job-search keywords from a resume. Return concise, deduplicated keywords only, and place each technical skill in exactly one category.',
  buildInput(input: { resumeMarkdown: string }): string {
    return [
      'Read this Markdown resume and extract keywords for job searching.',
      'Return job-title keywords as role names.',
      "Return main technical skills as the small set of foundational technologies that define the candidate's primary engineering direction and the kinds of roles they should target. These are usually programming languages, major runtimes/platforms, or role-defining application frameworks, such as Java, .NET, React, or Node.js.",
      'Return secondary technical skills as supporting libraries, messaging systems, databases, cloud services, infrastructure tools, testing tools, protocols, and other complementary technologies, such as Kafka. Expertise level does not make a supporting technology a main skill.',
      "Classify by the technology's role in the candidate's stack, not by years of experience or proficiency. Put every technical skill in exactly one list and never duplicate a skill across the two lists.",
      'Prefer concrete terms present in or strongly supported by the resume. Do not invent seniority, roles, or skills.',
      '',
      input.resumeMarkdown,
    ].join('\n');
  },
};
