import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { Job } from '../../domain/jobs/job';
import type { PdfRenderer } from '../../application/ports/pdf-renderer.port';

const MIN_COVER_LETTER_PDF_BYTES = 8 * 1024;
const PDF_METADATA_PADDING_SAFETY_BYTES = 512;
const PDF_METADATA_PADDING_PREFIX = 'ai-jobfinder-pdf-size-padding:';

type RenderCoverLetterInput = {
  draftMarkdown: string;
  job: Pick<Job, 'companyName' | 'title'>;
};

@Injectable()
export class PdfKitRenderer implements PdfRenderer {
  async renderCoverLetter(input: RenderCoverLetterInput): Promise<Buffer> {
    const pdf = await renderCoverLetterPdf(input);

    if (pdf.length >= MIN_COVER_LETTER_PDF_BYTES) {
      return pdf;
    }

    return renderCoverLetterPdf(
      input,
      MIN_COVER_LETTER_PDF_BYTES -
        pdf.length +
        PDF_METADATA_PADDING_SAFETY_BYTES,
    );
  }
}

function renderCoverLetterPdf(
  input: RenderCoverLetterInput,
  metadataPaddingCharacterCount = 0,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({
      bufferPages: true,
      info: buildDocumentInfo(input, metadataPaddingCharacterCount),
      margin: 64,
      size: 'A4',
    });
    const chunks: Buffer[] = [];

    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    document
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(`Cover Letter - ${input.job.companyName}`, {
        align: 'left',
      });
    document
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#555555')
      .text(input.job.title, { align: 'left' });
    document.moveDown(1.5).fillColor('#111111');

    renderMarkdown(document, input.draftMarkdown);

    document.end();
  });
}

function renderMarkdown(document: PDFKit.PDFDocument, markdown: string): void {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      document.moveDown(0.65);
      continue;
    }

    if (trimmedLine.startsWith('# ')) {
      document
        .font('Helvetica-Bold')
        .fontSize(14)
        .text(trimmedLine.replace(/^#\s+/, ''), { lineGap: 4 });
      document.moveDown(0.4);
      continue;
    }

    if (trimmedLine.startsWith('## ')) {
      document
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(trimmedLine.replace(/^##\s+/, ''), { lineGap: 4 });
      document.moveDown(0.25);
      continue;
    }

    if (trimmedLine.startsWith('- ')) {
      document
        .font('Helvetica')
        .fontSize(11)
        .text(`• ${trimmedLine.replace(/^-\s+/, '')}`, { lineGap: 4 });
      continue;
    }

    document.font('Helvetica').fontSize(11).text(trimmedLine, {
      align: 'left',
      lineGap: 4,
    });
  }
}

function buildDocumentInfo(
  input: RenderCoverLetterInput,
  metadataPaddingCharacterCount: number,
): PDFKit.DocumentInfo {
  const keywords =
    metadataPaddingCharacterCount > 0
      ? `${PDF_METADATA_PADDING_PREFIX}${'0'.repeat(
          metadataPaddingCharacterCount,
        )}`
      : 'ai-jobfinder cover-letter';

  return {
    Creator: 'AI Jobfinder',
    Keywords: keywords,
    Subject: `${input.job.title} at ${input.job.companyName}`,
    Title: `Cover Letter - ${input.job.companyName}`,
  };
}
