import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { Job } from '../../domain/jobs/job';
import type { PdfRenderer } from '../../application/ports/pdf-renderer.port';

@Injectable()
export class PdfKitRenderer implements PdfRenderer {
  async renderCoverLetter(input: {
    draftMarkdown: string;
    job: Pick<Job, 'companyName' | 'title'>;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({
        bufferPages: true,
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
