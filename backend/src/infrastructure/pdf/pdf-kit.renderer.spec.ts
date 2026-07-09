import { PdfKitRenderer } from './pdf-kit.renderer';

describe('PdfKitRenderer', () => {
  it('renders cover-letter Markdown to a PDF buffer with the minimum upload-friendly size', async () => {
    const pdf = await new PdfKitRenderer().renderCoverLetter({
      draftMarkdown: '# Hello\n\nDear Example,\n\n- One\n- Two',
      job: {
        companyName: 'Example GmbH',
        title: 'Frontend Developer',
      },
    });

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThanOrEqual(8 * 1024);
    expect(pdf.toString('latin1').trimEnd().endsWith('%%EOF')).toBe(true);
  });
});
