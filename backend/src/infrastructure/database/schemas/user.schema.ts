import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

export const DEFAULT_USER_ID = 'default-user';

export type UserDocument = HydratedDocument<User>;
export type StoredTechnicalSkillKeyword =
  | string
  | {
      keyword: string;
      weight: number;
    };

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {
  @Prop({ required: true, type: String })
  _id!: string;

  @Prop({ default: '', required: true, type: String })
  resumeMarkdown!: string;

  @Prop({ default: '', required: true, type: String })
  coverLetterInstructionTemplate!: string;

  @Prop({ default: [], required: true, type: [String] })
  jobTitleKeywords!: string[];

  @Prop({ default: [], required: true, type: [SchemaTypes.Mixed] })
  technicalSkillKeywords!: StoredTechnicalSkillKeyword[];

  @Prop({ default: 1, required: true, type: Number })
  matchingProfileVersion!: number;

  createdAt!: Date;

  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
