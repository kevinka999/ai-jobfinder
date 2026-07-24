import { normalizeApplicationUrl } from './duplicate-normalization';

describe('duplicate normalization', () => {
  it('normalizes job application URLs for duplicate detection', () => {
    expect(
      normalizeApplicationUrl(
        ' HTTPS://Example.COM/jobs/123/?utm_source=agent&foo=bar&gclid=abc#apply ',
      ),
    ).toBe('https://example.com/jobs/123?foo=bar');
  });
});
