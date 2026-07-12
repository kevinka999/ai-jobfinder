export function toCoverLetterPdfFilename(companyName: string) {
  const safeCompanyName = toKebabCase(companyName, 'company');

  return `${safeCompanyName}-cover-letter.pdf`;
}

function toKebabCase(value: string, fallback: string) {
  const slug = value
    .trim()
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
}
