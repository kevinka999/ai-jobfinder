import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Application } from '../../../domain/applications/application';
import type { Job } from '../../../domain/jobs/job';
import type { ApplicationRepository } from '../../ports/application-repository.port';
import type { JobRepository } from '../../ports/job-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';
import type { UserProfile } from '../../../domain/users/user-profile';
import { ApplyJobUseCase } from './apply-job.use-case';
import { DeleteJobUseCase } from './delete-job.use-case';
import { KeepDraftJobUseCase } from './keep-draft-job.use-case';
import { UpdateJobUseCase } from './update-job.use-case';

describe('job workflow use cases', () => {
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
  let applicationRepository: jest.Mocked<ApplicationRepository>;

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
      findById: jest.fn(),
      list: jest.fn(),
      updateEditableFields: jest.fn(),
      updateStatus: jest.fn(),
    };
    applicationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserAndJobId: jest.fn(),
      list: jest.fn(),
      updateTracking: jest.fn(),
    };
  });

  it('keeps draft jobs by changing status to active', async () => {
    const draftJob = buildJob({ status: 'draft' });
    const activeJob = buildJob({ status: 'active' });
    jobRepository.findById.mockResolvedValue(draftJob);
    jobRepository.updateStatus.mockResolvedValue(activeJob);

    await expect(
      new KeepDraftJobUseCase(userRepository, jobRepository).execute({
        jobId: draftJob.id,
      }),
    ).resolves.toEqual(activeJob);

    expect(jobRepository.updateStatus).toHaveBeenCalledWith({
      userId: user.id,
      jobId: draftJob.id,
      status: 'active',
    });
  });

  it('does not keep non-draft jobs', async () => {
    jobRepository.findById.mockResolvedValue(buildJob({ status: 'active' }));

    await expect(
      new KeepDraftJobUseCase(userRepository, jobRepository).execute({
        jobId: 'job-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(jobRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('hard-deletes only draft jobs', async () => {
    const draftJob = buildJob({ status: 'draft' });
    jobRepository.findById.mockResolvedValue(draftJob);
    jobRepository.delete.mockResolvedValue(true);

    await expect(
      new DeleteJobUseCase(userRepository, jobRepository).execute({
        jobId: draftJob.id,
      }),
    ).resolves.toEqual({ deleted: true });

    expect(jobRepository.delete).toHaveBeenCalledWith({
      userId: user.id,
      jobId: draftJob.id,
    });
    expect(jobRepository.softDeleteActive).not.toHaveBeenCalled();
  });

  it('soft-deletes active jobs', async () => {
    const activeJob = buildJob({ status: 'active' });
    const deletedAt = new Date('2026-07-08T12:30:00.000Z');
    jobRepository.findById.mockResolvedValue(activeJob);
    jobRepository.softDeleteActive.mockResolvedValue(
      buildJob({ status: 'active', deletedAt }),
    );

    await expect(
      new DeleteJobUseCase(userRepository, jobRepository).execute({
        jobId: activeJob.id,
      }),
    ).resolves.toEqual({ deleted: true });

    expect(jobRepository.softDeleteActive).toHaveBeenCalledWith({
      userId: user.id,
      jobId: activeJob.id,
    });
    expect(jobRepository.delete).not.toHaveBeenCalled();
  });

  it('does not delete applied jobs', async () => {
    jobRepository.findById.mockResolvedValue(buildJob({ status: 'applied' }));

    await expect(
      new DeleteJobUseCase(userRepository, jobRepository).execute({
        jobId: 'job-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(jobRepository.delete).not.toHaveBeenCalled();
    expect(jobRepository.softDeleteActive).not.toHaveBeenCalled();
  });

  it('marks active jobs as applied and creates an application', async () => {
    const activeJob = buildJob({ status: 'active' });
    const appliedJob = buildJob({ status: 'applied' });
    const application = buildApplication({ jobId: activeJob.id });
    jobRepository.findById.mockResolvedValue(activeJob);
    jobRepository.updateStatus.mockResolvedValue(appliedJob);
    applicationRepository.findByUserAndJobId.mockResolvedValue(null);
    applicationRepository.create.mockResolvedValue(application);

    const result = await new ApplyJobUseCase(
      userRepository,
      jobRepository,
      applicationRepository,
    ).execute({ jobId: activeJob.id });

    expect(result).toEqual({ application, job: appliedJob });
    expect(jobRepository.updateStatus).toHaveBeenCalledWith({
      userId: user.id,
      jobId: activeJob.id,
      status: 'applied',
    });
    expect(applicationRepository.create).toHaveBeenCalledWith({
      userId: user.id,
      jobId: activeJob.id,
      status: 'applied',
      statusChangedAt: expect.any(Date) as Date,
    });
  });

  it('rejects apply for non-active jobs', async () => {
    jobRepository.findById.mockResolvedValue(buildJob({ status: 'draft' }));

    await expect(
      new ApplyJobUseCase(
        userRepository,
        jobRepository,
        applicationRepository,
      ).execute({ jobId: 'job-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(jobRepository.updateStatus).not.toHaveBeenCalled();
    expect(applicationRepository.create).not.toHaveBeenCalled();
  });

  it('updates editable fields without changing status', async () => {
    const updatedJob = buildJob({
      status: 'applied',
      companyName: 'Updated GmbH',
    });
    jobRepository.updateEditableFields.mockResolvedValue(updatedJob);

    await expect(
      new UpdateJobUseCase(userRepository, jobRepository).execute({
        jobId: updatedJob.id,
        fields: { companyName: 'Updated GmbH' },
      }),
    ).resolves.toEqual(updatedJob);

    expect(jobRepository.updateEditableFields).toHaveBeenCalledWith({
      userId: user.id,
      jobId: updatedJob.id,
      fields: { companyName: 'Updated GmbH' },
    });
    expect(jobRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('returns not found when updating a missing job', async () => {
    jobRepository.updateEditableFields.mockResolvedValue(null);

    await expect(
      new UpdateJobUseCase(userRepository, jobRepository).execute({
        jobId: 'missing',
        fields: { companyName: 'Updated GmbH' },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
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
    createdAt: new Date('2026-07-08T12:00:00.000Z'),
    updatedAt: new Date('2026-07-08T12:00:00.000Z'),
    ...overrides,
  };
}

function buildApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: '64a000000000000000000010',
    userId: 'default-user',
    jobId: '64a000000000000000000001',
    status: 'applied',
    statusHistory: [
      {
        status: 'applied',
        changedAt: new Date('2026-07-08T12:00:00.000Z'),
      },
    ],
    createdAt: new Date('2026-07-08T12:00:00.000Z'),
    updatedAt: new Date('2026-07-08T12:00:00.000Z'),
    ...overrides,
  };
}
