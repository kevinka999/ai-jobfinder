import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ApplicationRepository,
  CreateApplicationInput,
} from '../../../application/ports/application-repository.port';
import type { Application as DomainApplication } from '../../../domain/applications/application';
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
}

function mapApplicationDocument(
  application: ApplicationDocument,
): DomainApplication {
  return {
    id: application._id.toString(),
    userId: application.userId,
    jobId: application.jobId.toString(),
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
