import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { APPLICATION_STATUSES } from '../../../domain/applications/application-status';
import type { ApplicationStatus } from '../../../domain/applications/application-status';

export type ApplicationDocument = HydratedDocument<Application>;

@Schema({ _id: false })
export class ApplicationStatusHistoryEntry {
  @Prop({ enum: APPLICATION_STATUSES, required: true, type: String })
  status!: ApplicationStatus;

  @Prop({ required: true, type: Date })
  changedAt!: Date;
}

const ApplicationStatusHistoryEntrySchema = SchemaFactory.createForClass(
  ApplicationStatusHistoryEntry,
);

@Schema({
  collection: 'applications',
  timestamps: true,
})
export class Application {
  _id!: Types.ObjectId;

  @Prop({ required: true, type: String })
  userId!: string;

  @Prop({ ref: 'Job', required: true, type: SchemaTypes.ObjectId })
  jobId!: Types.ObjectId;

  @Prop({ trim: true, type: String })
  companyMatchKey?: string;

  @Prop({ enum: APPLICATION_STATUSES, required: true, type: String })
  status!: ApplicationStatus;

  @Prop({ trim: true, type: String })
  notes?: string;

  @Prop({
    default: [],
    required: true,
    type: [ApplicationStatusHistoryEntrySchema],
  })
  statusHistory!: ApplicationStatusHistoryEntry[];

  createdAt!: Date;

  updatedAt!: Date;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);

ApplicationSchema.index({ userId: 1, status: 1 });
ApplicationSchema.index({ userId: 1, jobId: 1 });
ApplicationSchema.index({ userId: 1, companyMatchKey: 1, createdAt: -1 });
