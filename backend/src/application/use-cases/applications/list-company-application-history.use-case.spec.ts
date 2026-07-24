import type { Application } from '../../../domain/applications/application';
import type { Job } from '../../../domain/jobs/job';
import type { UserProfile } from '../../../domain/users/user-profile';
import type { ApplicationRepository } from '../../ports/application-repository.port';
import type { JobRepository } from '../../ports/job-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';
import { ListCompanyApplicationHistoryUseCase } from './list-company-application-history.use-case';

describe('ListCompanyApplicationHistoryUseCase', () => {
  const now = new Date('2026-07-14T12:00:00.000Z');
  const user: UserProfile = {
    id: 'default-user',
    resumeMarkdown: '# Resume',
    coverLetterInstructionTemplate: '',
    jobTitleKeywords: [],
    mainTechnicalSkillKeywords: [],
    secondaryTechnicalSkillKeywords: [],
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
      findByIds: jest.fn(),
      list: jest.fn(),
      updateEditableFields: jest.fn(),
      updateFavorite: jest.fn(),
      updateStatus: jest.fn(),
    };
    applicationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserAndJobId: jest.fn(),
      list: jest.fn(),
      listByCompanyMatchKeys: jest.fn(),
      listMissingCompanyMatchKey: jest.fn(),
      updateCompanyMatchKeyByJobId: jest.fn(),
      updateTracking: jest.fn(),
    };
  });

  it('refreshes stale application keys and excludes the requested job itself', async () => {
    const currentJob = buildJob({
      id: '64a000000000000000000001',
      companyName: 'Sprad',
      title: 'Frontend Developer',
    });
    const previousJob = buildJob({
      id: '64a000000000000000000002',
      companyName: 'Sprad Software GmbH',
      title: 'React Engineer',
    });
    const currentApplication = buildApplication({
      id: '64a000000000000000000010',
      jobId: currentJob.id,
      companyMatchKey: 'sprad',
    });
    const previousApplication = buildApplication({
      id: '64a000000000000000000011',
      jobId: previousJob.id,
      companyMatchKey: 'sprad software',
    });
    applicationRepository.list.mockResolvedValue([
      currentApplication,
      previousApplication,
    ]);
    jobRepository.findByIds
      .mockResolvedValueOnce([currentJob, previousJob])
      .mockResolvedValueOnce([currentJob])
      .mockResolvedValueOnce([currentJob, previousJob]);
    applicationRepository.listByCompanyMatchKeys.mockResolvedValue([
      currentApplication,
      { ...previousApplication, companyMatchKey: 'sprad' },
    ]);

    const result = await new ListCompanyApplicationHistoryUseCase(
      userRepository,
      jobRepository,
      applicationRepository,
    ).execute({ jobIds: [currentJob.id] });

    expect(
      applicationRepository.updateCompanyMatchKeyByJobId,
    ).toHaveBeenCalledWith({
      userId: user.id,
      jobId: previousJob.id,
      companyMatchKey: 'sprad',
    });
    expect(applicationRepository.listByCompanyMatchKeys).toHaveBeenCalledWith({
      userId: user.id,
      companyMatchKeys: ['sprad'],
    });
    expect(result).toEqual([
      {
        jobId: currentJob.id,
        companyName: currentJob.companyName,
        applications: [
          {
            id: previousApplication.id,
            jobId: previousJob.id,
            applicationUrl: previousJob.applicationUrl,
            companyName: previousJob.companyName,
            techStack: previousJob.techStack,
            title: previousJob.title,
            status: previousApplication.status,
            createdAt: previousApplication.createdAt,
          },
        ],
      },
    ]);
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
    isFavorite: false,
    createdAt: new Date('2026-07-14T12:00:00.000Z'),
    updatedAt: new Date('2026-07-14T12:00:00.000Z'),
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
        changedAt: new Date('2026-07-14T12:00:00.000Z'),
      },
    ],
    createdAt: new Date('2026-07-14T12:00:00.000Z'),
    updatedAt: new Date('2026-07-14T12:00:00.000Z'),
    ...overrides,
  };
}
