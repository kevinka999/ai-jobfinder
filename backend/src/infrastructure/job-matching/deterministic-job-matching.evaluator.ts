import { Injectable } from '@nestjs/common';
import type { JobMatchingEvaluator, JobMatchingEvaluationInput, JobMatchingEvaluationResult } from '../../application/ports/job-matching-evaluator.port';

const ALIASES: Record<string, string> = {
  node: 'node.js', 'nodejs': 'node.js', 'node.js': 'node.js',
  'react.js': 'react', react: 'react', postgres: 'postgresql', postgresql: 'postgresql',
  typescript: 'typescript', javascript: 'javascript', nest: 'nestjs', nestjs: 'nestjs',
};

@Injectable()
export class DeterministicJobMatchingEvaluator implements JobMatchingEvaluator {
  async evaluate(input: JobMatchingEvaluationInput): Promise<JobMatchingEvaluationResult> {
    const title = normalize(input.job.title);
    const description = normalize(input.job.description);
    const stack = new Set((input.job.techStack ?? []).map(normalizeSkill));
    const text = `${title} ${description}`;
    const titleMatches = input.profile.jobTitleKeywords.filter((keyword) => title.includes(normalize(keyword)));
    const titleScore = Math.min(20, titleMatches.length ? 12 + Math.min(8, titleMatches.length * 4) : 0);
    const skills = input.profile.technicalSkillKeywords.map((skill) => ({ ...skill, canonical: normalizeSkill(skill.keyword) }));
    const matched = skills.filter((skill) => stack.has(skill.canonical) || text.includes(skill.canonical));
    const totalWeight = skills.reduce((sum, skill) => sum + skill.weight, 0);
    const matchedWeight = matched.reduce((sum, skill) => sum + skill.weight * (stack.has(skill.canonical) ? 1 : 0.7), 0);
    const technicalScore = totalWeight ? Math.min(45, Math.round((matchedWeight / totalWeight) * 45)) : 0;
    const roleWords = ['engineer', 'developer', 'software', 'frontend', 'backend', 'full stack'];
    const engineeringRole = roleWords.some((word) => title.includes(word));
    const responsibilityScore = engineeringRole ? 14 : 0;
    const requirementScore = matched.some((skill) => skill.weight >= 8) ? 7 : 2;
    let matchingScore = titleScore + technicalScore + responsibilityScore + requirementScore;
    if (!engineeringRole) matchingScore = Math.min(matchingScore, 39);
    if (!titleMatches.length && !matched.some((skill) => skill.weight >= 8)) matchingScore = Math.min(matchingScore, 59);
    matchingScore = Math.max(0, Math.min(100, Math.round(matchingScore)));
    const matchedSkills = matched.map((skill) => skill.keyword);
    const missingOrWeakAreas = skills.filter((skill) => !matched.includes(skill) && skill.weight >= 6).map((skill) => skill.keyword);
    const strongest = matchedSkills.slice(0, 3).join(', ') || 'limited profile evidence';
    const gap = missingOrWeakAreas[0] ? `; main gap: ${missingOrWeakAreas[0]}` : '';
    return { matchingScore, matchingReason: `Evidence: ${strongest}${gap}.`, evidence: { titleScore, technicalScore, responsibilityScore, requirementScore, matchedSkills, missingOrWeakAreas } };
  }
}

function normalize(value: string): string { return value.toLocaleLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function normalizeSkill(value: string): string { const normalized = normalize(value); return ALIASES[normalized] ?? normalized; }
