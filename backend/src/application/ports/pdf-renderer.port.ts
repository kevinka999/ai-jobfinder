import type { Job } from '../../domain/jobs/job';

export const PDF_RENDERER = Symbol('PDF_RENDERER');

export interface PdfRenderer {
  renderCoverLetter(input: {
    draftMarkdown: string;
    job: Pick<Job, 'companyName' | 'title'>;
  }): Promise<Buffer>;
}
