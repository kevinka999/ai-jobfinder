import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateJobInput,
  JobRepository,
} from '../../../application/ports/job-repository.port';
import type { Job as DomainJob } from '../../../domain/jobs/job';
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
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}
