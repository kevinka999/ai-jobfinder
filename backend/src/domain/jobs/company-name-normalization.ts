const LEGAL_SUFFIX_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bg\.?\s*m\.?\s*b\.?\s*h\.?\b/gi, ' '],
  [/\bm\.?\s*b\.?\s*h\.?\b/gi, ' '],
  [/\bgesellschaft\s+mit\s+beschrankter\s+haftung\b/gi, ' '],
  [/\bgesellschaft\s+mit\s+beschränkter\s+haftung\b/gi, ' '],
];

const LEGAL_SUFFIX_TOKENS = new Set([
  'ag',
  'and',
  'bv',
  'co',
  'corp',
  'corporation',
  'e',
  'eu',
  'gbr',
  'gmbh',
  'inc',
  'kg',
  'kgaa',
  'llc',
  'llp',
  'limited',
  'ltd',
  'mbh',
  'nv',
  'og',
  'plc',
  'sarl',
  'se',
  'spa',
  'ug',
]);

export function normalizeCompanyMatchKey(companyName: string): string {
  const withoutDottedLegalForms = LEGAL_SUFFIX_REPLACEMENTS.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    companyName,
  );
  const normalizedTokens = withoutDottedLegalForms
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !LEGAL_SUFFIX_TOKENS.has(token));

  return normalizedTokens.join(' ');
}
