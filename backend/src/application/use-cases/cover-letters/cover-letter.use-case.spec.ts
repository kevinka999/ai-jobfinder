import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Job } from '../../../domain/jobs/job';
import type { UserProfile } from '../../../domain/users/user-profile';
import type { AiProvider } from '../../ports/ai-provider.port';
import type { JobRepository } from '../../ports/job-repository.port';
import type { PdfRenderer } from '../../ports/pdf-renderer.port';
import type { UserRepository } from '../../ports/user-repository.port';
import { GenerateCoverLetterDraftUseCase } from './generate-cover-letter-draft.use-case';
import { GenerateCoverLetterPdfUseCase } from './generate-cover-letter-pdf.use-case';
import { ReviseCoverLetterDraftUseCase } from './revise-cover-letter-draft.use-case';

describe('cover letter use cases', () => {
  const now = new Date('2026-07-08T12:00:00.000Z');
  const user: UserProfile = {
    id: 'default-user',
    resumeMarkdown: '# Resume',
    coverLetterInstructionTemplate: '',
    jobTitleKeywords: ['Frontend Developer'],
    technicalSkillKeywords: [{ keyword: 'React', weight: 9 }],
    createdAt: now,
    updatedAt: now,
  };
  let userRepository: jest.Mocked<UserRepository>;
  let jobRepository: jest.Mocked<JobRepository>;
  let aiProvider: jest.Mocked<AiProvider>;
  let pdfRenderer: jest.Mocked<PdfRenderer>;

  beforeEach(() => {
    userRepository = {
      resolveDefaultUser: jest.fn().mockResolvedValue(user),
      saveCoverLetterInstructionTemplate: jest.fn(),
      saveProfileKeywords: jest.fn(),
      saveResumeWithKeywords: jest.fn(),
    };
    jobRepository = {
      create: jest.fn(),
      delete: jest.fn(),
      softDeleteActive: jest.fn(),
      findDuplicateCandidate: jest.fn(),
      findById: jest.fn().mockResolvedValue(buildJob()),
      list: jest.fn(),
      updateEditableFields: jest.fn(),
      updateStatus: jest.fn(),
    };
    aiProvider = {
      extractResumeKeywords: jest.fn(),
      generateCoverLetterDraft: jest.fn(),
      reviseCoverLetterDraft: jest.fn(),
    };
    pdfRenderer = {
      renderCoverLetter: jest.fn(),
    };
  });

  it('generates a draft for active jobs using resume and job details', async () => {
    aiProvider.generateCoverLetterDraft.mockResolvedValue({
      draftMarkdown: 'Dear Example GmbH...',
    });

    await expect(
      new GenerateCoverLetterDraftUseCase(
        userRepository,
        jobRepository,
        aiProvider,
      ).execute({
        jobId: '64a000000000000000000001',
        userInstructions: 'Mention React.',
      }),
    ).resolves.toEqual({ draftMarkdown: 'Dear Example GmbH...' });

    expect(aiProvider.generateCoverLetterDraft).toHaveBeenCalledWith({
      resumeMarkdown: '# Resume',
      job: expect.objectContaining({
        companyName: 'Example GmbH',
        title: 'Frontend Developer',
        matchingScore: 86,
      }),
      userInstructions: 'Mention React.',
    });
  });

  it('revises a draft without storing generated text', async () => {
    aiProvider.reviseCoverLetterDraft.mockResolvedValue({
      draftMarkdown: 'Revised draft',
    });

    await expect(
      new ReviseCoverLetterDraftUseCase(
        userRepository,
        jobRepository,
        aiProvider,
      ).execute({
        jobId: '64a000000000000000000001',
        currentDraftMarkdown: 'Current draft',
        revisionInstructions: 'Make it shorter.',
      }),
    ).resolves.toEqual({ draftMarkdown: 'Revised draft' });

    expect(aiProvider.reviseCoverLetterDraft).toHaveBeenCalledWith({
      resumeMarkdown: '# Resume',
      job: expect.not.objectContaining({
        matchingScore: expect.anything() as number,
      }),
      currentDraftMarkdown: 'Current draft',
      revisionInstructions: 'Make it shorter.',
    });
    expect(jobRepository.updateEditableFields).not.toHaveBeenCalled();
  });

  it('renders a PDF for active jobs without storing it', async () => {
    const pdf = Buffer.from('%PDF-1.3');
    pdfRenderer.renderCoverLetter.mockResolvedValue(pdf);

    const result = await new GenerateCoverLetterPdfUseCase(
      userRepository,
      jobRepository,
      pdfRenderer,
    ).execute({
      jobId: '64a000000000000000000001',
      finalDraftMarkdown: 'Final draft',
    });

    expect(result).toEqual({
      pdf,
      filename: 'example-gmbh-cover-letter.pdf',
    });
    expect(pdfRenderer.renderCoverLetter).toHaveBeenCalledWith({
      draftMarkdown: 'Final draft',
      job: expect.objectContaining({
        companyName: 'Example GmbH',
        title: 'Frontend Developer',
      }),
    });
  });

  it('rejects cover-letter actions for non-active jobs', async () => {
    jobRepository.findById.mockResolvedValue(buildJob({ status: 'draft' }));

    await expect(
      new GenerateCoverLetterDraftUseCase(
        userRepository,
        jobRepository,
        aiProvider,
      ).execute({
        jobId: '64a000000000000000000001',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(aiProvider.generateCoverLetterDraft).not.toHaveBeenCalled();
  });

  it('returns a clean server error when draft generation fails', async () => {
    aiProvider.generateCoverLetterDraft.mockRejectedValue(
      new Error('missing key'),
    );

    await expect(
      new GenerateCoverLetterDraftUseCase(
        userRepository,
        jobRepository,
        aiProvider,
      ).execute({
        jobId: '64a000000000000000000001',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});

function buildJob(overrides: Partial<Job> = {}): Job {
  return {
    id: '64a000000000000000000001',
    userId: 'default-user',
    companyName: 'Example GmbH',
    title: 'Frontend Developer',
    applicationUrl: 'https://example.com/jobs/1',
    description: 'React and TypeScript role.',
    sourcePlatformId: 'linkedin',
    status: 'active',
    location: 'Vienna',
    workModel: 'hybrid',
    techStack: ['React', 'TypeScript'],
    matchingScore: 86,
    matchingReason: 'Strong React match.',
    createdAt: new Date('2026-07-08T12:00:00.000Z'),
    updatedAt: new Date('2026-07-08T12:00:00.000Z'),
    ...overrides,
  };
}
