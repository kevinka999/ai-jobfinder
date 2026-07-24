import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import type { JobDocument } from '../schemas/job.schema';
import { MongoJobRepository } from './mongo-job.repository';

describe('MongoJobRepository duplicate detection', () => {
  const existingJob = {
    _id: new Types.ObjectId('64a000000000000000000001'),
    userId: 'default-user',
    companyName: 'Sprad Software GmbH',
    title: 'React Engineer',
    applicationUrl: 'https://first-portal.example/jobs/123',
    description: 'React role.',
    sourcePlatformId: 'linkedin',
    status: 'active',
    isFavorite: false,
    matching: {
      status: 'pending',
      profileVersion: 1,
      inputVersion: 1,
      requestedVersion: 1,
    },
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  } as JobDocument;

  it('queries by the shared company match key without requiring the title', async () => {
    const findOne = jest
      .fn()
      .mockReturnValue(sortedQueryResolving(existingJob));
    const repository = new MongoJobRepository({
      findOne,
    } as unknown as Model<JobDocument>);

    const result = await repository.findDuplicateCandidate({
      userId: 'default-user',
      applicationUrl: 'https://second-portal.example/jobs/456',
      companyName: 'Sprad',
    });

    expect(findOne).toHaveBeenCalledWith({
      userId: 'default-user',
      status: { $in: ['active', 'applied'] },
      $or: [
        {
          normalizedApplicationUrl: 'https://second-portal.example/jobs/456',
        },
        { normalizedCompanyName: 'sprad' },
      ],
    });
    expect(result?.id).toBe(existingJob._id.toString());
  });

  it('uses source company names to match records stored with an older key', async () => {
    const updateExec = jest.fn().mockResolvedValue(undefined);
    const updateOne = jest.fn().mockReturnValue({ exec: updateExec });
    const repository = new MongoJobRepository({
      findOne: jest.fn().mockReturnValue(sortedQueryResolving(null)),
      find: jest.fn().mockReturnValue(sortedQueryResolving([existingJob])),
      updateOne,
    } as unknown as Model<JobDocument>);

    const result = await repository.findDuplicateCandidate({
      userId: 'default-user',
      applicationUrl: 'https://second-portal.example/jobs/456',
      companyName: 'Sprad',
    });

    expect(updateOne).toHaveBeenCalledWith(
      { _id: existingJob._id, userId: 'default-user' },
      { $set: { normalizedCompanyName: 'sprad' } },
    );
    expect(result?.id).toBe(existingJob._id.toString());
  });
});

function sortedQueryResolving(value: unknown) {
  return {
    sort: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(value),
    }),
  };
}
