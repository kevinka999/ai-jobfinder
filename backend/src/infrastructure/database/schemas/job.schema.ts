import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { SOURCE_PLATFORM_IDS } from '../../../domain/source-platforms/source-platform';
import type { SourcePlatformId } from '../../../domain/source-platforms/source-platform';
import {
  normalizeApplicationUrl,
  normalizeComparableText,
} from '../../../domain/jobs/duplicate-normalization';
import { JOB_STATUSES } from '../../../domain/jobs/job-status';
import type { JobStatus } from '../../../domain/jobs/job-status';
import { WORK_MODELS } from '../../../domain/jobs/work-model';
import type { WorkModel } from '../../../domain/jobs/work-model';

export type JobDocument = HydratedDocument<Job>;

@Schema({ _id: false })
export class JobMetadata {
  @Prop({ ref: 'Job', type: SchemaTypes.ObjectId })
  possibleDuplicatedJobId?: Types.ObjectId;
}

const JobMetadataSchema = SchemaFactory.createForClass(JobMetadata);

@Schema({
  collection: 'jobs',
  timestamps: true,
})
export class Job {
  _id!: Types.ObjectId;

  @Prop({ required: true, type: String })
  userId!: string;

  @Prop({ required: true, trim: true, type: String })
  companyName!: string;

  @Prop({ required: true, trim: true, type: String })
  title!: string;

  @Prop({ required: true, trim: true, type: String })
  applicationUrl!: string;

  @Prop({ required: true, trim: true, type: String })
  description!: string;

  @Prop({ enum: SOURCE_PLATFORM_IDS, required: true, type: String })
  sourcePlatformId!: SourcePlatformId;

  @Prop({ enum: JOB_STATUSES, required: true, type: String })
  status!: JobStatus;

  @Prop({ trim: true, type: String })
  location?: string;

  @Prop({ enum: WORK_MODELS, type: String })
  workModel?: WorkModel;

  @Prop({ trim: true, type: String })
  salaryText?: string;

  @Prop({ default: undefined, type: [String] })
  techStack?: string[];

  @Prop({ type: Number })
  matchingScore?: number;

  @Prop({ trim: true, type: String })
  matchingReason?: string;

  @Prop({ type: Date })
  postedAt?: Date;

  @Prop({ type: Date })
  applyDeadline?: Date;

  @Prop({ trim: true, type: String })
  contactInfo?: string;

  @Prop({ trim: true, type: String })
  rawText?: string;

  @Prop({ type: JobMetadataSchema })
  metadata?: JobMetadata;

  @Prop({ required: true, select: false, type: String })
  normalizedApplicationUrl!: string;

  @Prop({ required: true, select: false, type: String })
  normalizedCompanyName!: string;

  @Prop({ required: true, select: false, type: String })
  normalizedTitle!: string;

  createdAt!: Date;

  updatedAt!: Date;
}

export const JobSchema = SchemaFactory.createForClass(Job);

JobSchema.pre('validate', function () {
  this.normalizedApplicationUrl = normalizeApplicationUrl(this.applicationUrl);
  this.normalizedCompanyName = normalizeComparableText(this.companyName);
  this.normalizedTitle = normalizeComparableText(this.title);
});

JobSchema.index({ userId: 1, status: 1 });
JobSchema.index({ userId: 1, applicationUrl: 1 });
JobSchema.index({ userId: 1, normalizedApplicationUrl: 1, status: 1 });
JobSchema.index({
  userId: 1,
  normalizedCompanyName: 1,
  normalizedTitle: 1,
  status: 1,
});
