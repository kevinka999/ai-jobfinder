import { PdfKitRenderer } from './pdf-kit.renderer';

describe('PdfKitRenderer', () => {
  it('renders cover-letter Markdown to a PDF buffer', async () => {
    const pdf = await new PdfKitRenderer().renderCoverLetter({
      draftMarkdown: '# Hello\n\nDear Example,\n\n- One\n- Two',
      job: {
        companyName: 'Example GmbH',
        title: 'Frontend Developer',
      },
    });

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(1000);
  });
});
