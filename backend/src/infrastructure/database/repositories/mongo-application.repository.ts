import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ApplicationRepository,
  CreateApplicationInput,
} from '../../../application/ports/application-repository.port';
import type { Application as DomainApplication } from '../../../domain/applications/application';
import type { ApplicationStatus } from '../../../domain/applications/application-status';
import {
  Application,
  ApplicationDocument,
} from '../schemas/application.schema';

@Injectable()
export class MongoApplicationRepository implements ApplicationRepository {
  constructor(
    @InjectModel(Application.name)
    private readonly applicationModel: Model<ApplicationDocument>,
  ) {}

  async create(input: CreateApplicationInput): Promise<DomainApplication> {
    const application = await this.applicationModel.create({
      userId: input.userId,
      jobId: new Types.ObjectId(input.jobId),
      companyMatchKey: input.companyMatchKey,
      status: input.status,
      statusHistory: [
        {
          status: input.status,
          changedAt: input.statusChangedAt,
        },
      ],
    });

    return mapApplicationDocument(application);
  }

  async findById(input: {
    userId: string;
    applicationId: string;
  }): Promise<DomainApplication | null> {
    if (!Types.ObjectId.isValid(input.applicationId)) {
      return null;
    }

    const application = await this.applicationModel
      .findOne({
        _id: new Types.ObjectId(input.applicationId),
        userId: input.userId,
      })
      .exec();

    return application ? mapApplicationDocument(application) : null;
  }

  async findByUserAndJobId(input: {
    userId: string;
    jobId: string;
  }): Promise<DomainApplication | null> {
    if (!Types.ObjectId.isValid(input.jobId)) {
      return null;
    }

    const application = await this.applicationModel
      .findOne({
        userId: input.userId,
        jobId: new Types.ObjectId(input.jobId),
      })
      .exec();

    return application ? mapApplicationDocument(application) : null;
  }

  async list(input: {
    userId: string;
    status?: ApplicationStatus;
  }): Promise<DomainApplication[]> {
    const applications = await this.applicationModel
      .find({
        userId: input.userId,
        ...(input.status ? { status: input.status } : {}),
      })
      .sort({ createdAt: -1 })
      .exec();

    return applications.map((application) =>
      mapApplicationDocument(application),
    );
  }

  async listMissingCompanyMatchKey(input: {
    userId: string;
  }): Promise<DomainApplication[]> {
    const applications = await this.applicationModel
      .find({
        userId: input.userId,
        $or: [
          { companyMatchKey: { $exists: false } },
          { companyMatchKey: null },
          { companyMatchKey: '' },
        ],
      })
      .exec();

    return applications.map((application) =>
      mapApplicationDocument(application),
    );
  }

  async listByCompanyMatchKeys(input: {
    userId: string;
    companyMatchKeys: string[];
  }): Promise<DomainApplication[]> {
    if (input.companyMatchKeys.length === 0) {
      return [];
    }

    const applications = await this.applicationModel
      .find({
        userId: input.userId,
        companyMatchKey: { $in: input.companyMatchKeys },
      })
      .sort({ createdAt: -1 })
      .exec();

    return applications.map((application) =>
      mapApplicationDocument(application),
    );
  }

  async updateCompanyMatchKeyByJobId(input: {
    userId: string;
    jobId: string;
    companyMatchKey: string;
  }): Promise<void> {
    if (!Types.ObjectId.isValid(input.jobId)) {
      return;
    }

    await this.applicationModel
      .updateMany(
        {
          userId: input.userId,
          jobId: new Types.ObjectId(input.jobId),
        },
        { $set: { companyMatchKey: input.companyMatchKey } },
      )
      .exec();
  }

  async updateTracking(input: {
    userId: string;
    applicationId: string;
    status?: ApplicationStatus;
    notes?: string;
    statusChangedAt?: Date;
  }): Promise<DomainApplication | null> {
    if (!Types.ObjectId.isValid(input.applicationId)) {
      return null;
    }

    const update: {
      $set?: Record<string, string>;
      $push?: {
        statusHistory: {
          status: ApplicationStatus;
          changedAt: Date;
        };
      };
    } = {};

    if (input.status !== undefined) {
      update.$set = { ...(update.$set ?? {}), status: input.status };
    }

    if (input.notes !== undefined) {
      update.$set = { ...(update.$set ?? {}), notes: input.notes };
    }

    if (input.status !== undefined && input.statusChangedAt) {
      update.$push = {
        statusHistory: {
          status: input.status,
          changedAt: input.statusChangedAt,
        },
      };
    }

    const application = await this.applicationModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(input.applicationId),
          userId: input.userId,
        },
        update,
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    return application ? mapApplicationDocument(application) : null;
  }
}

function mapApplicationDocument(
  application: ApplicationDocument,
): DomainApplication {
  return {
    id: application._id.toString(),
    userId: application.userId,
    jobId: application.jobId.toString(),
    companyMatchKey: application.companyMatchKey,
    status: application.status,
    notes: application.notes,
    statusHistory: application.statusHistory.map((entry) => ({
      status: entry.status,
      changedAt: entry.changedAt,
    })),
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
}
