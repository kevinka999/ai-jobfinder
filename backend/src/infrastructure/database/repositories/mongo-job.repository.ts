import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateJobInput,
  JobEditableFields,
  JobRepository,
} from '../../../application/ports/job-repository.port';
import type { Job as DomainJob } from '../../../domain/jobs/job';
import type { JobStatus } from '../../../domain/jobs/job-status';
import {
  normalizeApplicationUrl,
  normalizeComparableText,
} from '../../../domain/jobs/duplicate-normalization';
import { Job, JobDocument } from '../schemas/job.schema';

@Injectable()
export class MongoJobRepository implements JobRepository {
  constructor(
    @InjectModel(Job.name)
    private readonly jobModel: Model<JobDocument>,
  ) {}

  async create(input: CreateJobInput): Promise<DomainJob> {
    const job = await this.jobModel.create({
      ...input,
      metadata: input.metadata?.possibleDuplicatedJobId
        ? {
            possibleDuplicatedJobId: new Types.ObjectId(
              input.metadata.possibleDuplicatedJobId,
            ),
          }
        : undefined,
    });

    return mapJobDocument(job);
  }

  async delete(input: { userId: string; jobId: string }): Promise<boolean> {
    if (!Types.ObjectId.isValid(input.jobId)) {
      return false;
    }

    const result = await this.jobModel
      .deleteOne({
        _id: new Types.ObjectId(input.jobId),
        userId: input.userId,
      })
      .exec();

    return result.deletedCount === 1;
  }

  async softDeleteActive(input: {
    userId: string;
    jobId: string;
  }): Promise<DomainJob | null> {
    if (!Types.ObjectId.isValid(input.jobId)) {
      return null;
    }

    const job = await this.jobModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(input.jobId),
          userId: input.userId,
          status: 'active',
          deletedAt: null,
        },
        { $set: { deletedAt: new Date() } },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    return job ? mapJobDocument(job) : null;
  }

  async findDuplicateCandidate(input: {
    userId: string;
    applicationUrl: string;
    companyName: string;
    title: string;
  }): Promise<DomainJob | null> {
    const normalizedApplicationUrl = normalizeApplicationUrl(
      input.applicationUrl,
    );
    const normalizedCompanyName = normalizeComparableText(input.companyName);
    const normalizedTitle = normalizeComparableText(input.title);
    const job = await this.jobModel
      .findOne({
        userId: input.userId,
        status: { $in: ['active', 'applied'] },
        $or: [
          { normalizedApplicationUrl },
          { normalizedCompanyName, normalizedTitle },
        ],
      })
      .sort({ createdAt: 1 })
      .exec();

    return job ? mapJobDocument(job) : null;
  }

  async findById(input: {
    userId: string;
    jobId: string;
  }): Promise<DomainJob | null> {
    if (!Types.ObjectId.isValid(input.jobId)) {
      return null;
    }

    const job = await this.jobModel
      .findOne({
        _id: new Types.ObjectId(input.jobId),
        userId: input.userId,
        deletedAt: null,
      })
      .exec();

    return job ? mapJobDocument(job) : null;
  }

  async findByIds(input: {
    userId: string;
    jobIds: string[];
  }): Promise<DomainJob[]> {
    const objectIds = input.jobIds
      .filter((jobId) => Types.ObjectId.isValid(jobId))
      .map((jobId) => new Types.ObjectId(jobId));

    if (objectIds.length === 0) {
      return [];
    }

    const jobs = await this.jobModel
      .find({
        _id: { $in: objectIds },
        userId: input.userId,
        deletedAt: null,
      })
      .exec();

    return jobs.map((job) => mapJobDocument(job));
  }

  async list(input: {
    userId: string;
    status?: JobStatus;
  }): Promise<DomainJob[]> {
    const jobs = await this.jobModel
      .find({
        userId: input.userId,
        ...(input.status ? { status: input.status } : {}),
        deletedAt: null,
      })
      .sort({ createdAt: -1 })
      .exec();

    return jobs.map((job) => mapJobDocument(job));
  }

  async updateEditableFields(input: {
    userId: string;
    jobId: string;
    fields: Partial<JobEditableFields>;
  }): Promise<DomainJob | null> {
    if (!Types.ObjectId.isValid(input.jobId)) {
      return null;
    }

    const job = await this.jobModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(input.jobId),
          userId: input.userId,
          deletedAt: null,
        },
        {
          $set: {
            ...input.fields,
            ...buildNormalizedFieldUpdates(input.fields),
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    return job ? mapJobDocument(job) : null;
  }

  async updateFavorite(input: {
    userId: string;
    jobId: string;
    isFavorite: boolean;
  }): Promise<DomainJob | null> {
    if (!Types.ObjectId.isValid(input.jobId)) {
      return null;
    }

    const job = await this.jobModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(input.jobId),
          userId: input.userId,
          deletedAt: null,
        },
        { $set: { isFavorite: input.isFavorite } },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    return job ? mapJobDocument(job) : null;
  }

  async updateStatus(input: {
    userId: string;
    jobId: string;
    status: JobStatus;
  }): Promise<DomainJob | null> {
    if (!Types.ObjectId.isValid(input.jobId)) {
      return null;
    }

    const job = await this.jobModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(input.jobId),
          userId: input.userId,
          deletedAt: null,
        },
        { $set: { status: input.status } },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    return job ? mapJobDocument(job) : null;
  }
}

function buildNormalizedFieldUpdates(
  fields: Partial<JobEditableFields>,
): Record<string, string> {
  const updates: Record<string, string> = {};

  if (fields.applicationUrl !== undefined) {
    updates.normalizedApplicationUrl = normalizeApplicationUrl(
      fields.applicationUrl,
    );
  }

  if (fields.companyName !== undefined) {
    updates.normalizedCompanyName = normalizeComparableText(fields.companyName);
  }

  if (fields.title !== undefined) {
    updates.normalizedTitle = normalizeComparableText(fields.title);
  }

  return updates;
}

function mapJobDocument(job: JobDocument): DomainJob {
  return {
    id: job._id.toString(),
    userId: job.userId,
    companyName: job.companyName,
    title: job.title,
    applicationUrl: job.applicationUrl,
    description: job.description,
    sourcePlatformId: job.sourcePlatformId,
    status: job.status,
    isFavorite: job.isFavorite ?? false,
    location: job.location,
    workModel: job.workModel,
    salaryText: job.salaryText,
    techStack: job.techStack,
    matchingScore: job.matchingScore,
    matchingReason: job.matchingReason,
    postedAt: job.postedAt,
    applyDeadline: job.applyDeadline,
    contactInfo: job.contactInfo,
    rawText: job.rawText,
    metadata: job.metadata?.possibleDuplicatedJobId
      ? {
          possibleDuplicatedJobId:
            job.metadata.possibleDuplicatedJobId.toString(),
        }
      : undefined,
    deletedAt: job.deletedAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}
