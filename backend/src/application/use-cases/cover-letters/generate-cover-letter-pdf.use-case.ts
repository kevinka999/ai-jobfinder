import { Inject, Injectable } from '@nestjs/common';
import type { Job } from '../../../domain/jobs/job';
import { JOB_REPOSITORY } from '../../ports/job-repository.port';
import type { JobRepository } from '../../ports/job-repository.port';
import { PDF_RENDERER } from '../../ports/pdf-renderer.port';
import type { PdfRenderer } from '../../ports/pdf-renderer.port';
import { USER_REPOSITORY } from '../../ports/user-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';
import { loadActiveCoverLetterContext } from './cover-letter-context';

export type GenerateCoverLetterPdfOutput = {
  pdf: Buffer;
  filename: string;
};

@Injectable()
export class GenerateCoverLetterPdfUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(JOB_REPOSITORY)
    private readonly jobRepository: JobRepository,
    @Inject(PDF_RENDERER)
    private readonly pdfRenderer: PdfRenderer,
  ) {}

  async execute(input: {
    jobId: string;
    finalDraftMarkdown: string;
  }): Promise<GenerateCoverLetterPdfOutput> {
    const { job } = await loadActiveCoverLetterContext({
      userRepository: this.userRepository,
      jobRepository: this.jobRepository,
      jobId: input.jobId,
    });
    const pdf = await this.pdfRenderer.renderCoverLetter({
      draftMarkdown: input.finalDraftMarkdown,
      job,
    });

    return {
      pdf,
      filename: buildCoverLetterFilename(job),
    };
  }
}

function buildCoverLetterFilename(job: Pick<Job, 'companyName' | 'title'>) {
  const slug = `${job.companyName}-${job.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `cover-letter-${slug || 'job'}.pdf`;
}
