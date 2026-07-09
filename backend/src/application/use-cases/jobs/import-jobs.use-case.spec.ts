import { BadRequestException } from '@nestjs/common';
import type { Job } from '../../../domain/jobs/job';
import type { JobRepository } from '../../ports/job-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';
import type { UserProfile } from '../../../domain/users/user-profile';
import {
  ImportJobsUseCase,
  validateImportJobsRequest,
} from './import-jobs.use-case';

describe('ImportJobsUseCase', () => {
  const now = new Date('2026-07-08T12:00:00.000Z');
  const user: UserProfile = {
    id: 'default-user',
    resumeMarkdown: '# Resume',
    coverLetterInstructionTemplate: '',
    jobTitleKeywords: [],
    technicalSkillKeywords: [],
    createdAt: now,
    updatedAt: now,
  };
  let userRepository: jest.Mocked<UserRepository>;
  let jobRepository: jest.Mocked<JobRepository>;
  let useCase: ImportJobsUseCase;

  beforeEach(() => {
    userRepository = {
      resolveDefaultUser: jest.fn().mockResolvedValue(user),
      saveCoverLetterInstructionTemplate: jest.fn(),
      saveResumeWithKeywords: jest.fn(),
    };
    jobRepository = {
      create: jest.fn(),
      delete: jest.fn(),
      softDeleteActive: jest.fn(),
      findDuplicateCandidate: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      updateEditableFields: jest.fn(),
      updateStatus: jest.fn(),
    };
    useCase = new ImportJobsUseCase(userRepository, jobRepository);
  });

  it('imports valid rows and returns invalid row errors without failing the whole request', async () => {
    jobRepository.findDuplicateCandidate.mockResolvedValue(null);
    jobRepository.create.mockImplementation(async (input) => ({
      ...input,
      id: `job-${jobRepository.create.mock.calls.length}`,
      createdAt: now,
      updatedAt: now,
    }));

    const result = await useCase.execute({
      jobs: [
        {
          companyName: 'Example GmbH',
          title: 'Frontend Developer',
          applicationUrl: 'https://example.com/jobs/1',
          description: 'React and TypeScript role.',
          sourcePlatformId: 'others',
          matchingScore: 86,
        },
        {
          companyName: '',
          title: 'Broken Job',
          applicationUrl: 'not-a-url',
          description: 'Missing source platform.',
          sourcePlatformId: 'unknown',
        },
      ],
    });

    expect(jobRepository.create).toHaveBeenCalledTimes(1);
    expect(jobRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ sourcePlatformId: 'others' }),
    );
    expect(result.createdActiveJobs).toHaveLength(1);
    expect(result.invalidRows).toHaveLength(1);
    expect(result.invalidRows[0]).toMatchObject({ index: 1 });
    expect(result.summary).toEqual({
      received: 2,
      createdActive: 1,
      createdDraft: 0,
      invalid: 1,
    });
  });

  it('creates duplicate imports as drafts with the possible duplicate id', async () => {
    const duplicateJob = buildJob({ id: '64a000000000000000000001' });
    jobRepository.findDuplicateCandidate.mockResolvedValue(duplicateJob);
    jobRepository.create.mockImplementation(async (input) => ({
      ...input,
      id: '64a000000000000000000002',
      createdAt: now,
      updatedAt: now,
    }));

    const result = await useCase.execute({
      jobs: [
        {
          companyName: 'Example GmbH',
          title: 'Frontend Developer',
          applicationUrl: 'https://example.com/jobs/1',
          description: 'React and TypeScript role.',
          sourcePlatformId: 'linkedin',
        },
      ],
    });

    expect(jobRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'draft',
        metadata: { possibleDuplicatedJobId: duplicateJob.id },
      }),
    );
    expect(result.createdActiveJobs).toHaveLength(0);
    expect(result.createdDraftJobs).toHaveLength(1);
    expect(result.summary.createdDraft).toBe(1);
  });

  it('creates imports that duplicate soft-deleted active jobs as drafts', async () => {
    const duplicateJob = buildJob({
      id: '64a000000000000000000001',
      status: 'active',
      deletedAt: new Date('2026-07-08T12:30:00.000Z'),
    });
    jobRepository.findDuplicateCandidate.mockResolvedValue(duplicateJob);
    jobRepository.create.mockImplementation(async (input) => ({
      ...input,
      id: '64a000000000000000000002',
      createdAt: now,
      updatedAt: now,
    }));

    const result = await useCase.execute({
      jobs: [
        {
          companyName: 'Example GmbH',
          title: 'Frontend Developer',
          applicationUrl: 'https://example.com/jobs/1',
          description: 'React and TypeScript role.',
          sourcePlatformId: 'linkedin',
        },
      ],
    });

    expect(jobRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'draft',
        metadata: { possibleDuplicatedJobId: duplicateJob.id },
      }),
    );
    expect(result.createdDraftJobs).toHaveLength(1);
  });
});

describe('validateImportJobsRequest', () => {
  it('rejects malformed top-level payloads', () => {
    expect(() => validateImportJobsRequest({ jobs: [], extra: true })).toThrow(
      BadRequestException,
    );
    expect(() => validateImportJobsRequest({ jobs: 'nope' })).toThrow(
      BadRequestException,
    );
  });

  it('keeps rows with unknown fields invalid', () => {
    const result = validateImportJobsRequest({
      jobs: [
        {
          companyName: 'Example GmbH',
          title: 'Frontend Developer',
          applicationUrl: 'https://example.com/jobs/1',
          description: 'React and TypeScript role.',
          sourcePlatformId: 'linkedin',
          unexpected: 'field',
        },
      ],
    });

    expect(result.validRows).toHaveLength(0);
    expect(result.invalidRows).toHaveLength(1);
    expect(result.invalidRows[0]?.errors.join(' ')).toContain(
      'property unexpected should not exist',
    );
  });
});

function buildJob(overrides: Partial<Job> = {}): Job {
  return {
    id: '64a000000000000000000000',
    userId: 'default-user',
    companyName: 'Example GmbH',
    title: 'Frontend Developer',
    applicationUrl: 'https://example.com/jobs/1',
    description: 'React and TypeScript role.',
    sourcePlatformId: 'linkedin',
    status: 'active',
    createdAt: new Date('2026-07-08T12:00:00.000Z'),
    updatedAt: new Date('2026-07-08T12:00:00.000Z'),
    ...overrides,
  };
}
