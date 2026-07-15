import { normalizeCompanyMatchKey } from './company-name-normalization';

describe('company name normalization', () => {
  it('removes common legal suffixes from company names', () => {
    expect(normalizeCompanyMatchKey('Example GmbH')).toBe('example');
    expect(normalizeCompanyMatchKey('Example G.m.b.H.')).toBe('example');
    expect(normalizeCompanyMatchKey('Example GmbH & Co KG')).toBe('example');
  });

  it('normalizes punctuation, accents, and whitespace', () => {
    expect(
      normalizeCompanyMatchKey(
        '  Österreichische Apotheker-Verlagsgesellschaft m.b.H  ',
      ),
    ).toBe('osterreichische apotheker verlagsgesellschaft');
  });
});
