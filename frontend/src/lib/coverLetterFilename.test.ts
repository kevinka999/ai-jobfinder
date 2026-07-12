import { describe, expect, it } from 'vitest';
import { toCoverLetterPdfFilename } from './coverLetterFilename';

describe('toCoverLetterPdfFilename', () => {
  it('formats the company name as lowercase kebab case', () => {
    expect(toCoverLetterPdfFilename(' Example / Group.One GmbH ')).toBe(
      'example-group-one-gmbh-cover-letter.pdf',
    );
  });

  it('falls back when the company name has no filename-safe characters', () => {
    expect(toCoverLetterPdfFilename('---')).toBe('company-cover-letter.pdf');
  });
});
