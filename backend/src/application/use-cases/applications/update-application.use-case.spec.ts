import { NotFoundException } from '@nestjs/common';
import type { Application } from '../../../domain/applications/application';
import type { Job } from '../../../domain/jobs/job';
import type { ApplicationRepository } from '../../ports/application-repository.port';
import type { JobRepository } from '../../ports/job-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';
import type { UserProfile } from '../../../domain/users/user-profile';
import { ListApplicationsUseCase } from './list-applications.use-case';
import { UpdateApplicationUseCase } from './update-application.use-case';

describe('UpdateApplicationUseCase', () => {
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
  let applicationRepository: jest.Mocked<ApplicationRepository>;
  let jobRepository: jest.Mocked<JobRepository>;
  let useCase: UpdateApplicationUseCase;

  beforeEach(() => {
    userRepository = {
      resolveDefaultUser: jest.fn().mockResolvedValue(user),
      saveCoverLetterInstructionTemplate: jest.fn(),
      saveProfileKeywords: jest.fn(),
      saveResumeWithKeywords: jest.fn(),
    };
    applicationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserAndJobId: jest.fn(),
      list: jest.fn(),
      updateTracking: jest.fn(),
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
    useCase = new UpdateApplicationUseCase(
      userRepository,
      applicationRepository,
      jobRepository,
    );
  });

  it('updates notes without appending status history', async () => {
    const application = buildApplication({ notes: 'Old note' });
    const updatedApplication = buildApplication({ notes: 'New note' });
    const job = buildJob();
    applicationRepository.findById.mockResolvedValue(application);
    applicationRepository.updateTracking.mockResolvedValue(updatedApplication);
    jobRepository.findById.mockResolvedValue(job);

    await expect(
      useCase.execute({
        applicationId: application.id,
        notes: 'New note',
      }),
    ).resolves.toEqual({ application: updatedApplication, job });

    expect(applicationRepository.updateTracking).toHaveBeenCalledWith({
      userId: user.id,
      applicationId: application.id,
      status: undefined,
      notes: 'New note',
      statusChangedAt: undefined,
    });
  });

  it('appends status history only when status changes', async () => {
    const application = buildApplication({ status: 'applied' });
    const updatedApplication = buildApplication({
      status: 'interviewing',
      statusHistory: [
        {
          status: 'applied',
          changedAt: now,
        },
        {
          status: 'interviewing',
          changedAt: new Date('2026-07-09T12:00:00.000Z'),
        },
      ],
    });
    applicationRepository.findById.mockResolvedValue(application);
    applicationRepository.updateTracking.mockResolvedValue(updatedApplication);
    jobRepository.findById.mockResolvedValue(buildJob());

    const result = await useCase.execute({
      applicationId: application.id,
      status: 'interviewing',
    });

    expect(result.application.status).toBe('interviewing');
    expect(applicationRepository.updateTracking).toHaveBeenCalledWith({
      userId: user.id,
      applicationId: application.id,
      status: 'interviewing',
      notes: undefined,
      statusChangedAt: expect.any(Date) as Date,
    });
  });

  it('does not append history when the submitted status is unchanged', async () => {
    const application = buildApplication({ status: 'applied' });
    applicationRepository.findById.mockResolvedValue(application);
    jobRepository.findById.mockResolvedValue(buildJob());

    await expect(
      useCase.execute({
        applicationId: application.id,
        status: 'applied',
      }),
    ).resolves.toEqual({ application, job: buildJob() });

    expect(applicationRepository.updateTracking).not.toHaveBeenCalled();
  });

  it('returns not found for missing applications', async () => {
    applicationRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        applicationId: 'missing',
        notes: 'New note',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('ListApplicationsUseCase', () => {
  it('loads applications with their job details', async () => {
    const now = new Date('2026-07-08T12:00:00.000Z');
    const userRepository: jest.Mocked<UserRepository> = {
      resolveDefaultUser: jest.fn().mockResolvedValue({
        id: 'default-user',
        resumeMarkdown: '',
        coverLetterInstructionTemplate: '',
        jobTitleKeywords: [],
        technicalSkillKeywords: [],
        createdAt: now,
        updatedAt: now,
      }),
      saveCoverLetterInstructionTemplate: jest.fn(),
      saveProfileKeywords: jest.fn(),
      saveResumeWithKeywords: jest.fn(),
    };
    const application = buildApplication();
    const job = buildJob();
    const applicationRepository: jest.Mocked<ApplicationRepository> = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserAndJobId: jest.fn(),
      list: jest.fn().mockResolvedValue([application]),
      updateTracking: jest.fn(),
    };
    const jobRepository: jest.Mocked<JobRepository> = {
      create: jest.fn(),
      delete: jest.fn(),
      softDeleteActive: jest.fn(),
      findDuplicateCandidate: jest.fn(),
      findById: jest.fn().mockResolvedValue(job),
      list: jest.fn(),
      updateEditableFields: jest.fn(),
      updateStatus: jest.fn(),
    };

    const result = await new ListApplicationsUseCase(
      userRepository,
      applicationRepository,
      jobRepository,
    ).execute({ status: 'applied' });

    expect(applicationRepository.list).toHaveBeenCalledWith({
      userId: 'default-user',
      status: 'applied',
    });
    expect(result).toEqual([{ application, job }]);
  });
});

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

function buildJob(overrides: Partial<Job> = {}): Job {
  return {
    id: '64a000000000000000000001',
    userId: 'default-user',
    companyName: 'Example GmbH',
    title: 'Frontend Developer',
    applicationUrl: 'https://example.com/jobs/1',
    description: 'React and TypeScript role.',
    sourcePlatformId: 'linkedin',
    status: 'applied',
    createdAt: new Date('2026-07-08T12:00:00.000Z'),
    updatedAt: new Date('2026-07-08T12:00:00.000Z'),
    ...overrides,
  };
}
